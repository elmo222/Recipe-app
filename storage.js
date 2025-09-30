/**
 * Recipe Storage System using IndexedDB
 * Handles all data persistence for recipes, tags, and images
 */

class RecipeStorage {
    constructor() {
        this.dbName = 'VibeRecipeDB';
        this.dbVersion = 1;
        this.db = null;
    }

    /**
     * Initialize the database
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('Database failed to open');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('Database opened successfully');
                resolve();
            };

            request.onupgradeneeded = (e) => {
                this.db = e.target.result;

                // Create recipes object store
                if (!this.db.objectStoreNames.contains('recipes')) {
                    const recipeStore = this.db.createObjectStore('recipes', {
                        keyPath: 'id',
                        autoIncrement: true
                    });

                    // Create indexes for searching
                    recipeStore.createIndex('title', 'title', { unique: false });
                    recipeStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
                    recipeStore.createIndex('createdAt', 'createdAt', { unique: false });
                }

                // Create images object store
                if (!this.db.objectStoreNames.contains('images')) {
                    const imageStore = this.db.createObjectStore('images', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    imageStore.createIndex('recipeId', 'recipeId', { unique: false });
                }

                console.log('Database setup complete');
            };
        });
    }

    /**
     * Save a recipe to the database
     */
    async saveRecipe(recipe) {
        const transaction = this.db.transaction(['recipes'], 'readwrite');
        const store = transaction.objectStore('recipes');

        // Add metadata
        recipe.createdAt = recipe.createdAt || new Date().toISOString();
        recipe.updatedAt = new Date().toISOString();

        return new Promise((resolve, reject) => {
            const request = store.put(recipe);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Get a recipe by ID
     */
    async getRecipe(id) {
        const transaction = this.db.transaction(['recipes'], 'readonly');
        const store = transaction.objectStore('recipes');

        return new Promise((resolve, reject) => {
            const request = store.get(id);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Get all recipes
     */
    async getAllRecipes() {
        const transaction = this.db.transaction(['recipes'], 'readonly');
        const store = transaction.objectStore('recipes');

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Search recipes by title, ingredients, or tags
     */
    async searchRecipes(query, filters = {}) {
        const recipes = await this.getAllRecipes();
        const searchTerm = query.toLowerCase();

        return recipes.filter(recipe => {
            // Text search
            const titleMatch = recipe.title.toLowerCase().includes(searchTerm);
            const ingredientsMatch = recipe.ingredients.toLowerCase().includes(searchTerm);
            const tagsMatch = recipe.tags.some(tag => 
                tag.toLowerCase().includes(searchTerm)
            );

            const textMatch = !query || titleMatch || ingredientsMatch || tagsMatch;

            // Tag filter
            const tagFilter = !filters.tags || filters.tags.length === 0 || 
                filters.tags.some(tag => recipe.tags.includes(tag));

            // Time filter
            const timeFilter = !filters.maxTime || 
                !recipe.cookingTime || 
                recipe.cookingTime <= filters.maxTime;

            return textMatch && tagFilter && timeFilter;
        });
    }

    /**
     * Delete a recipe
     */
    async deleteRecipe(id) {
        const transaction = this.db.transaction(['recipes', 'images'], 'readwrite');
        const recipeStore = transaction.objectStore('recipes');
        const imageStore = transaction.objectStore('images');

        // Delete recipe
        await new Promise((resolve, reject) => {
            const request = recipeStore.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });

        // Delete associated images
        const imageIndex = imageStore.index('recipeId');
        const imageRequest = imageIndex.getAll(id);
        
        return new Promise((resolve, reject) => {
            imageRequest.onsuccess = () => {
                const images = imageRequest.result;
                const deletePromises = images.map(image => {
                    return new Promise((res, rej) => {
                        const deleteReq = imageStore.delete(image.id);
                        deleteReq.onsuccess = () => res();
                        deleteReq.onerror = () => rej(deleteReq.error);
                    });
                });

                Promise.all(deletePromises)
                    .then(() => resolve())
                    .catch(reject);
            };
            
            imageRequest.onerror = () => reject(imageRequest.error);
        });
    }

    /**
     * Save an image for a recipe
     */
    async saveImage(recipeId, imageFile, imageData) {
        const transaction = this.db.transaction(['images'], 'readwrite');
        const store = transaction.objectStore('images');

        const imageRecord = {
            recipeId: recipeId,
            filename: imageFile.name,
            type: imageFile.type,
            size: imageFile.size,
            data: imageData,
            createdAt: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const request = store.add(imageRecord);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Get all images for a recipe
     */
    async getRecipeImages(recipeId) {
        const transaction = this.db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const index = store.index('recipeId');

        return new Promise((resolve, reject) => {
            const request = index.getAll(recipeId);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Get all unique tags from recipes
     */
    async getAllTags() {
        const recipes = await this.getAllRecipes();
        const tagSet = new Set();

        recipes.forEach(recipe => {
            recipe.tags.forEach(tag => tagSet.add(tag));
        });

        return Array.from(tagSet).sort();
    }

    /**
     * Export all data as JSON
     */
    async exportData() {
        const recipes = await this.getAllRecipes();
        const images = [];

        // Get all images
        for (const recipe of recipes) {
            const recipeImages = await this.getRecipeImages(recipe.id);
            images.push(...recipeImages);
        }

        return {
            recipes,
            images,
            exportDate: new Date().toISOString(),
            version: this.dbVersion
        };
    }

    /**
     * Import data from JSON
     */
    async importData(data) {
        const transaction = this.db.transaction(['recipes', 'images'], 'readwrite');
        const recipeStore = transaction.objectStore('recipes');
        const imageStore = transaction.objectStore('images');

        // Import recipes
        for (const recipe of data.recipes) {
            await new Promise((resolve, reject) => {
                const request = recipeStore.put(recipe);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }

        // Import images
        for (const image of data.images) {
            await new Promise((resolve, reject) => {
                const request = imageStore.put(image);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }

        return true;
    }

    /**
     * Clear all data
     */
    async clearAllData() {
        const transaction = this.db.transaction(['recipes', 'images'], 'readwrite');
        const recipeStore = transaction.objectStore('recipes');
        const imageStore = transaction.objectStore('images');

        await Promise.all([
            new Promise((resolve, reject) => {
                const request = recipeStore.clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            }),
            new Promise((resolve, reject) => {
                const request = imageStore.clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            })
        ]);

        return true;
    }
}

// Create global storage instance
window.recipeStorage = new RecipeStorage();