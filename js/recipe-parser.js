/**
 * Recipe Parser for URL Import
 * Extracts recipe data from web pages using various methods
 */

class RecipeParser {
    constructor() {
        this.corsProxy = 'https://api.allorigins.win/raw?url=';
        this.fallbackProxy = 'https://cors-anywhere.herokuapp.com/';
    }

    /**
     * Extract recipe from URL
     */
    async extractRecipe(url) {
        try {
            // Validate URL
            if (!this.isValidUrl(url)) {
                throw new Error('Invalid URL provided');
            }

            // Try to fetch the page content
            const html = await this.fetchPageContent(url);
            
            // Parse the HTML content
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Try different extraction methods
            let recipe = await this.extractFromJsonLd(doc) ||
                        await this.extractFromMicrodata(doc) ||
                        await this.extractFromOpenGraph(doc) ||
                        await this.extractFromCommonSelectors(doc);

            if (!recipe) {
                throw new Error('Could not extract recipe data from this URL');
            }

            // Clean and validate the extracted data
            recipe = this.cleanRecipeData(recipe);
            recipe.sourceUrl = url;
            recipe.extractedAt = new Date().toISOString();

            // Download and convert images to base64
            if (recipe.images && recipe.images.length > 0) {
                recipe.images = await this.downloadImages(recipe.images);
            }

            return recipe;

        } catch (error) {
            console.error('Recipe extraction failed:', error);
            throw error;
        }
    }

    /**
     * Validate URL format
     */
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    /**
     * Fetch page content using CORS proxy
     */
    async fetchPageContent(url) {
        const proxies = [this.corsProxy, this.fallbackProxy];
        
        for (const proxy of proxies) {
            try {
                const response = await fetch(proxy + encodeURIComponent(url));
                if (response.ok) {
                    return await response.text();
                }
            } catch (error) {
                console.warn(`Failed to fetch with proxy ${proxy}:`, error);
            }
        }

        // If proxies fail, try direct fetch (will only work for same-origin or CORS-enabled sites)
        try {
            const response = await fetch(url);
            if (response.ok) {
                return await response.text();
            }
        } catch (error) {
            console.warn('Direct fetch failed:', error);
        }

        throw new Error('Unable to fetch page content. The website may not allow cross-origin requests.');
    }

    /**
     * Extract recipe from JSON-LD structured data
     */
    async extractFromJsonLd(doc) {
        const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
        
        for (const script of scripts) {
            try {
                const data = JSON.parse(script.textContent);
                const recipe = this.findRecipeInJsonLd(data);
                
                if (recipe) {
                    return this.parseJsonLdRecipe(recipe);
                }
            } catch (error) {
                console.warn('Failed to parse JSON-LD:', error);
            }
        }
        
        return null;
    }

    /**
     * Find recipe object in JSON-LD data
     */
    findRecipeInJsonLd(data) {
        if (Array.isArray(data)) {
            for (const item of data) {
                const recipe = this.findRecipeInJsonLd(item);
                if (recipe) return recipe;
            }
        } else if (data && typeof data === 'object') {
            if (data['@type'] === 'Recipe' || 
                (Array.isArray(data['@type']) && data['@type'].includes('Recipe'))) {
                return data;
            }
            
            // Check nested objects
            for (const key in data) {
                if (typeof data[key] === 'object') {
                    const recipe = this.findRecipeInJsonLd(data[key]);
                    if (recipe) return recipe;
                }
            }
        }
        
        return null;
    }

    /**
     * Parse JSON-LD recipe data
     */
    parseJsonLdRecipe(data) {
        const recipe = {
            title: this.extractText(data.name),
            ingredients: this.extractIngredients(data.recipeIngredient),
            instructions: this.extractInstructions(data.recipeInstructions),
            cookingTime: this.extractTime(data.cookTime || data.totalTime),
            servings: this.extractNumber(data.recipeYield || data.yield),
            tags: this.extractTags(data.recipeCategory, data.recipeCuisine, data.keywords),
            description: this.extractText(data.description),
            images: this.extractImages(data.image)
        };

        return recipe;
    }

    /**
     * Extract recipe from microdata
     */
    async extractFromMicrodata(doc) {
        const recipeElements = doc.querySelectorAll('[itemtype*="Recipe"]');
        
        if (recipeElements.length === 0) {
            return null;
        }

        const recipeEl = recipeElements[0];
        
        return {
            title: this.getItempropText(recipeEl, 'name'),
            ingredients: this.getItempropArray(recipeEl, 'recipeIngredient'),
            instructions: this.getItempropArray(recipeEl, 'recipeInstructions'),
            cookingTime: this.parseTimeString(this.getItempropText(recipeEl, 'cookTime')),
            servings: this.extractNumber(this.getItempropText(recipeEl, 'recipeYield')),
            tags: this.getItempropArray(recipeEl, 'recipeCategory'),
            description: this.getItempropText(recipeEl, 'description'),
            images: this.getItempropImages(recipeEl, 'image')
        };
    }

    /**
     * Extract recipe from Open Graph meta tags
     */
    async extractFromOpenGraph(doc) {
        const title = doc.querySelector('meta[property="og:title"]')?.content ||
                     doc.querySelector('title')?.textContent;
        
        const description = doc.querySelector('meta[property="og:description"]')?.content ||
                           doc.querySelector('meta[name="description"]')?.content;
        
        const image = doc.querySelector('meta[property="og:image"]')?.content;

        if (!title) return null;

        return {
            title: title.trim(),
            description: description?.trim() || '',
            images: image ? [image] : [],
            ingredients: '',
            instructions: '',
            cookingTime: null,
            servings: null,
            tags: []
        };
    }

    /**
     * Extract recipe using common CSS selectors
     */
    async extractFromCommonSelectors(doc) {
        const selectors = {
            title: ['h1', '.recipe-title', '.entry-title', '[class*="title"]'],
            ingredients: ['.recipe-ingredients li', '.ingredients li', '[class*="ingredient"]'],
            instructions: ['.recipe-instructions li', '.instructions li', '[class*="instruction"]', '[class*="direction"]'],
            time: ['[class*="time"]', '[class*="duration"]'],
            servings: ['[class*="serving"]', '[class*="yield"]']
        };

        const title = this.findBySelectors(doc, selectors.title);
        if (!title) return null;

        return {
            title: title.trim(),
            ingredients: this.findArrayBySelectors(doc, selectors.ingredients).join('\n'),
            instructions: this.findArrayBySelectors(doc, selectors.instructions).join('\n'),
            cookingTime: this.parseTimeString(this.findBySelectors(doc, selectors.time)),
            servings: this.extractNumber(this.findBySelectors(doc, selectors.servings)),
            tags: [],
            description: '',
            images: []
        };
    }

    /**
     * Helper methods for data extraction
     */
    extractText(value) {
        if (typeof value === 'string') return value.trim();
        if (value && value.text) return value.text.trim();
        if (value && value['@value']) return value['@value'].trim();
        return '';
    }

    extractIngredients(ingredients) {
        if (!ingredients) return '';
        if (typeof ingredients === 'string') return ingredients;
        if (Array.isArray(ingredients)) {
            return ingredients.map(ing => this.extractText(ing)).join('\n');
        }
        return '';
    }

    extractInstructions(instructions) {
        if (!instructions) return '';
        if (typeof instructions === 'string') return instructions;
        if (Array.isArray(instructions)) {
            return instructions.map((inst) => {
                const text = this.extractText(inst.text || inst);
                // Check if text already starts with a number
                if (/^\d+\.?\s/.test(text.trim())) {
                    return text.trim();
                }
                // If no number, don't add one - let the UI handle numbering
                return text.trim();
            }).join('\n');
        }
        return '';
    }

    extractTime(timeValue) {
        if (!timeValue) return null;
        
        if (typeof timeValue === 'number') return timeValue;
        
        const timeStr = this.extractText(timeValue);
        return this.parseTimeString(timeStr);
    }

    parseTimeString(timeStr) {
        if (!timeStr) return null;
        
        // Parse ISO 8601 duration (PT30M)
        const isoDuration = timeStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
        if (isoDuration) {
            const hours = parseInt(isoDuration[1] || 0);
            const minutes = parseInt(isoDuration[2] || 0);
            return hours * 60 + minutes;
        }

        // Parse common time formats
        const timeMatch = timeStr.match(/(\d+)\s*(hour|hr|h|minute|min|m)/gi);
        if (timeMatch) {
            let totalMinutes = 0;
            timeMatch.forEach(match => {
                const [, num, unit] = match.match(/(\d+)\s*(hour|hr|h|minute|min|m)/i);
                const value = parseInt(num);
                if (unit.toLowerCase().startsWith('h')) {
                    totalMinutes += value * 60;
                } else {
                    totalMinutes += value;
                }
            });
            return totalMinutes;
        }

        // Try to extract just numbers (assume minutes)
        const numberMatch = timeStr.match(/\d+/);
        return numberMatch ? parseInt(numberMatch[0]) : null;
    }

    extractNumber(value) {
        if (!value) return null;
        if (typeof value === 'number') return value;
        
        const text = this.extractText(value);
        const match = text.match(/\d+/);
        return match ? parseInt(match[0]) : null;
    }

    extractTags(...sources) {
        const tags = [];
        
        sources.forEach(source => {
            if (typeof source === 'string') {
                tags.push(source);
            } else if (Array.isArray(source)) {
                tags.push(...source.map(tag => this.extractText(tag)));
            } else if (source) {
                tags.push(this.extractText(source));
            }
        });

        return tags.filter(tag => tag && tag.length > 0);
    }

    extractImages(images) {
        if (!images) return [];
        if (typeof images === 'string') return [images];
        if (Array.isArray(images)) {
            return images.map(img => {
                if (typeof img === 'string') return img;
                if (img.url) return img.url;
                if (img['@id']) return img['@id'];
                return null;
            }).filter(Boolean);
        }
        if (images.url) return [images.url];
        return [];
    }

    getItempropText(element, property) {
        const el = element.querySelector(`[itemprop="${property}"]`);
        return el ? el.textContent.trim() : '';
    }

    getItempropArray(element, property) {
        const elements = element.querySelectorAll(`[itemprop="${property}"]`);
        return Array.from(elements).map(el => el.textContent.trim());
    }

    getItempropImages(element, property) {
        const elements = element.querySelectorAll(`[itemprop="${property}"]`);
        return Array.from(elements).map(el => {
            return el.src || el.content || el.href;
        }).filter(Boolean);
    }

    findBySelectors(doc, selectors) {
        for (const selector of selectors) {
            const element = doc.querySelector(selector);
            if (element && element.textContent.trim()) {
                return element.textContent.trim();
            }
        }
        return '';
    }

    findArrayBySelectors(doc, selectors) {
        for (const selector of selectors) {
            const elements = doc.querySelectorAll(selector);
            if (elements.length > 0) {
                return Array.from(elements).map(el => el.textContent.trim());
            }
        }
        return [];
    }

    /**
     * Download images and convert to base64 data URLs
     */
    async downloadImages(imageUrls) {
        const downloadedImages = [];
        const maxImages = 5; // Limit to prevent excessive downloads
        
        for (let i = 0; i < Math.min(imageUrls.length, maxImages); i++) {
            const imageUrl = imageUrls[i];
            try {
                const dataUrl = await this.downloadImage(imageUrl);
                if (dataUrl) {
                    downloadedImages.push(dataUrl);
                }
            } catch (error) {
                console.warn(`Failed to download image ${imageUrl}:`, error);
                // Continue with other images
            }
        }
        
        return downloadedImages;
    }

    /**
     * Download a single image and convert to base64 data URL
     */
    async downloadImage(imageUrl) {
        // Make URL absolute if it's relative
        const absoluteUrl = this.makeAbsoluteUrl(imageUrl);
        
        // Try different methods to download the image
        const methods = [
            () => this.downloadImageViaProxy(absoluteUrl),
            () => this.downloadImageDirect(absoluteUrl),
            () => this.downloadImageViaCanvas(absoluteUrl)
        ];
        
        for (const method of methods) {
            try {
                const result = await method();
                if (result) {
                    return result;
                }
            } catch (error) {
                console.warn('Image download method failed:', error);
            }
        }
        
        return null;
    }

    /**
     * Download image using CORS proxy
     */
    async downloadImageViaProxy(imageUrl) {
        const proxies = [this.corsProxy, this.fallbackProxy];
        
        for (const proxy of proxies) {
            try {
                const response = await fetch(proxy + encodeURIComponent(imageUrl));
                if (response.ok) {
                    const blob = await response.blob();
                    return await this.blobToDataUrl(blob);
                }
            } catch (error) {
                console.warn(`Proxy ${proxy} failed for image:`, error);
            }
        }
        
        return null;
    }

    /**
     * Download image directly (for CORS-enabled images)
     */
    async downloadImageDirect(imageUrl) {
        try {
            const response = await fetch(imageUrl);
            if (response.ok) {
                const blob = await response.blob();
                return await this.blobToDataUrl(blob);
            }
        } catch (error) {
            console.warn('Direct image fetch failed:', error);
        }
        
        return null;
    }

    /**
     * Download image using canvas (for same-origin images)
     */
    async downloadImageViaCanvas(imageUrl) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    canvas.width = img.width;
                    canvas.height = img.height;
                    
                    ctx.drawImage(img, 0, 0);
                    
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    resolve(dataUrl);
                } catch (error) {
                    console.warn('Canvas conversion failed:', error);
                    resolve(null);
                }
            };
            
            img.onerror = () => {
                resolve(null);
            };
            
            img.src = imageUrl;
            
            // Timeout after 10 seconds
            setTimeout(() => resolve(null), 10000);
        });
    }

    /**
     * Convert blob to data URL
     */
    async blobToDataUrl(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Make URL absolute if it's relative
     */
    makeAbsoluteUrl(url, baseUrl = null) {
        if (!url) return url;
        
        // Already absolute
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        
        // Protocol-relative
        if (url.startsWith('//')) {
            return 'https:' + url;
        }
        
        // If we have a base URL, use it
        if (baseUrl) {
            try {
                return new URL(url, baseUrl).href;
            } catch (error) {
                console.warn('Failed to make absolute URL:', error);
            }
        }
        
        return url;
    }

    /**
     * Clean and validate extracted recipe data
     */
    cleanRecipeData(recipe) {
        return {
            title: recipe.title || 'Untitled Recipe',
            ingredients: recipe.ingredients || '',
            instructions: recipe.instructions || '',
            cookingTime: recipe.cookingTime || null,
            servings: recipe.servings || null,
            tags: Array.isArray(recipe.tags) ? recipe.tags.filter(tag => tag.length > 0) : [],
            description: recipe.description || '',
            images: Array.isArray(recipe.images) ? recipe.images : [],
            sourceUrl: recipe.sourceUrl || '',
            extractedAt: recipe.extractedAt || new Date().toISOString()
        };
    }
}

// Create global parser instance
window.recipeParser = new RecipeParser();