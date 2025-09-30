/**
 * UI Management for Recipe App
 * Handles all user interface interactions and updates
 */

class RecipeUI {
    constructor() {
        this.currentRecipes = [];
        this.currentImages = [];
        this.editingRecipe = null;
        this.allTags = [];
    }

    /**
     * Initialize UI event listeners
     */
    init() {
        this.bindEventListeners();
        this.loadRecipes();
        this.loadTags();
    }

    /**
     * Bind all event listeners
     */
    bindEventListeners() {
        // Add recipe button
        document.getElementById('add-recipe-btn').addEventListener('click', () => {
            this.showAddRecipeModal();
        });

        // Search toggle
        document.getElementById('search-toggle').addEventListener('click', () => {
            this.toggleSearch();
        });

        // Share menu
        document.getElementById('share-menu-btn').addEventListener('click', () => {
            this.showShareModal();
        });

        // Search input
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.performSearch(e.target.value);
        });

        // Filter changes
        document.getElementById('filter-tags').addEventListener('change', () => {
            this.performSearch();
        });

        document.getElementById('filter-time').addEventListener('change', () => {
            this.performSearch();
        });

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal'));
            });
        });

        // Import method selection
        document.getElementById('import-url-btn').addEventListener('click', () => {
            this.showUrlImportForm();
        });

        document.getElementById('manual-entry-btn').addEventListener('click', () => {
            this.showManualEntryForm();
        });

        // URL extraction
        document.getElementById('extract-recipe-btn').addEventListener('click', () => {
            this.extractRecipeFromUrl();
        });

        // Recipe form submission
        document.getElementById('recipe-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveRecipe();
        });

        // Image upload
        this.setupImageUpload();

        // Tag input with suggestions
        this.setupTagInput();

        // Sharing functionality
        this.setupSharingEvents();

        // Modal backdrop clicks
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });
    }

    /**
     * Setup sharing event listeners
     */
    setupSharingEvents() {
        // Mobile share
        document.getElementById('mobile-share-btn').addEventListener('click', async () => {
            await this.shareViaMobile();
        });

        // Export recipes
        document.getElementById('export-recipes-btn').addEventListener('click', async () => {
            await this.exportRecipes();
        });

        // Import recipes
        document.getElementById('import-recipes-btn').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });

        document.getElementById('import-file').addEventListener('change', async (e) => {
            if (e.target.files.length > 0) {
                await this.importRecipes(e.target.files[0]);
            }
        });

        // Copy to clipboard
        document.getElementById('copy-recipes-btn').addEventListener('click', async () => {
            await this.copyRecipesToClipboard();
        });
    }

    /**
     * Load and display all recipes
     */
    async loadRecipes() {
        try {
            this.currentRecipes = await window.recipeStorage.getAllRecipes();
            this.renderRecipes(this.currentRecipes);
        } catch (error) {
            console.error('Failed to load recipes:', error);
            this.showError('Failed to load recipes');
        }
    }

    /**
     * Load all available tags
     */
    async loadTags() {
        try {
            this.allTags = await window.recipeStorage.getAllTags();
            this.updateTagFilter();
        } catch (error) {
            console.error('Failed to load tags:', error);
        }
    }

    /**
     * Render recipes in the grid
     */
    renderRecipes(recipes) {
        const grid = document.getElementById('recipe-grid');
        const emptyState = document.getElementById('empty-state');

        if (recipes.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        grid.style.display = 'grid';
        emptyState.style.display = 'none';

        grid.innerHTML = recipes.map(recipe => this.createRecipeCard(recipe)).join('');

        // Add click listeners to recipe cards
        grid.querySelectorAll('.recipe-card').forEach(card => {
            card.addEventListener('click', () => {
                const recipeId = parseInt(card.dataset.recipeId);
                this.showRecipeDetail(recipeId);
            });
        });
    }

    /**
     * Create HTML for a recipe card
     */
    createRecipeCard(recipe) {
        const firstImage = recipe.images && recipe.images.length > 0 ? recipe.images[0] : null;
        const imageHtml = firstImage 
            ? `<div class="recipe-card-image" style="background-image: url('${firstImage}')"></div>`
            : `<div class="recipe-card-image no-image">🍽️</div>`;

        const timeHtml = recipe.cookingTime 
            ? `<span><span class="icon">⏱️</span>${recipe.cookingTime} min</span>` 
            : '';

        const servingsHtml = recipe.servings 
            ? `<span><span class="icon">👥</span>${recipe.servings} servings</span>` 
            : '';

        const tagsHtml = recipe.tags.map(tag => 
            `<span class="recipe-tag">${tag}</span>`
        ).join('');

        return `
            <div class="recipe-card" data-recipe-id="${recipe.id}">
                ${imageHtml}
                <div class="recipe-card-content">
                    <h3 class="recipe-card-title">${this.escapeHtml(recipe.title)}</h3>
                    <div class="recipe-card-meta">
                        ${timeHtml}
                        ${servingsHtml}
                    </div>
                    <div class="recipe-card-tags">
                        ${tagsHtml}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Show recipe detail modal
     */
    async showRecipeDetail(recipeId) {
        try {
            const recipe = await window.recipeStorage.getRecipe(recipeId);
            const images = await window.recipeStorage.getRecipeImages(recipeId);
            
            if (!recipe) {
                this.showError('Recipe not found');
                return;
            }

            this.renderRecipeDetail(recipe, images);
            this.showModal('recipe-detail-modal');

            // Setup edit button
            document.getElementById('edit-recipe-btn').onclick = () => {
                this.editRecipe(recipe);
            };

        } catch (error) {
            console.error('Failed to load recipe detail:', error);
            this.showError('Failed to load recipe details');
        }
    }

    /**
     * Render recipe detail content
     */
    renderRecipeDetail(recipe, images) {
        document.getElementById('detail-title').textContent = recipe.title;

        const timeHtml = recipe.cookingTime ? `<span><strong>⏱️ Time:</strong> ${recipe.cookingTime} minutes</span>` : '';
        const servingsHtml = recipe.servings ? `<span><strong>👥 Servings:</strong> ${recipe.servings}</span>` : '';
        const sourceHtml = recipe.sourceUrl ? `<span><strong>🔗 Source:</strong> <a href="${recipe.sourceUrl}" target="_blank">View Original</a></span>` : '';

        const imagesHtml = images.length > 0 
            ? `<div class="recipe-detail-images">
                ${images.map(img => `
                    <div class="recipe-detail-image">
                        <img src="${img.data}" alt="Recipe image">
                    </div>
                `).join('')}
               </div>`
            : '';

        const tagsHtml = recipe.tags.length > 0 
            ? `<div class="recipe-card-tags">
                ${recipe.tags.map(tag => `<span class="recipe-tag">${tag}</span>`).join('')}
               </div>`
            : '';

        const ingredientsList = recipe.ingredients.split('\n').filter(ing => ing.trim()).map(ing => 
            `<li>${this.escapeHtml(ing.trim())}</li>`
        ).join('');

        const instructionsList = recipe.instructions.split('\n').filter(inst => inst.trim()).map(inst => 
            `<li>${this.escapeHtml(inst.trim())}</li>`
        ).join('');

        document.getElementById('recipe-detail-content').innerHTML = `
            <div class="recipe-detail">
                <div class="recipe-detail-header">
                    <h2 class="recipe-detail-title">${this.escapeHtml(recipe.title)}</h2>
                    <div class="recipe-detail-meta">
                        ${timeHtml}
                        ${servingsHtml}
                        ${sourceHtml}
                    </div>
                    ${tagsHtml}
                    ${recipe.description ? `<p>${this.escapeHtml(recipe.description)}</p>` : ''}
                </div>

                ${imagesHtml}

                <div class="recipe-detail-section">
                    <h3>Ingredients</h3>
                    <div class="recipe-ingredients">
                        <ul>${ingredientsList}</ul>
                    </div>
                </div>

                <div class="recipe-detail-section">
                    <h3>Instructions</h3>
                    <div class="recipe-instructions">
                        <ol>${instructionsList}</ol>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Show add recipe modal
     */
    showAddRecipeModal() {
        this.editingRecipe = null;
        this.resetRecipeForm();
        this.showModal('add-recipe-modal');
    }

    /**
     * Show share modal
     */
    showShareModal() {
        this.showModal('share-modal');
    }

    /**
     * Edit existing recipe
     */
    editRecipe(recipe) {
        this.editingRecipe = recipe;
        this.populateRecipeForm(recipe);
        this.closeModal(document.getElementById('recipe-detail-modal'));
        this.showModal('add-recipe-modal');
    }

    /**
     * Show URL import form
     */
    showUrlImportForm() {
        document.getElementById('url-import-form').classList.remove('hidden');
        document.getElementById('manual-entry-form').classList.add('hidden');
        document.getElementById('extraction-status').classList.add('hidden');
    }

    /**
     * Show manual entry form
     */
    showManualEntryForm() {
        document.getElementById('manual-entry-form').classList.remove('hidden');
        document.getElementById('url-import-form').classList.add('hidden');
    }

    /**
     * Extract recipe from URL
     */
    async extractRecipeFromUrl() {
        const urlInput = document.getElementById('recipe-url');
        const statusDiv = document.getElementById('extraction-status');
        const extractBtn = document.getElementById('extract-recipe-btn');

        const url = urlInput.value.trim();
        if (!url) {
            this.showStatus(statusDiv, 'Please enter a URL', 'error');
            return;
        }

        extractBtn.disabled = true;
        this.showStatus(statusDiv, 'Extracting recipe...', 'loading');

        try {
            const recipe = await window.recipeParser.extractRecipe(url);
            this.populateRecipeForm(recipe);
            this.showManualEntryForm();
            this.showStatus(statusDiv, 'Recipe extracted successfully!', 'success');
        } catch (error) {
            console.error('Recipe extraction failed:', error);
            this.showStatus(statusDiv, `Failed to extract recipe: ${error.message}`, 'error');
        } finally {
            extractBtn.disabled = false;
        }
    }

    /**
     * Save recipe (create or update)
     */
    async saveRecipe() {
        try {
            const formData = this.getRecipeFormData();
            
            if (this.editingRecipe) {
                formData.id = this.editingRecipe.id;
                formData.createdAt = this.editingRecipe.createdAt;
            }

            const recipeId = await window.recipeStorage.saveRecipe(formData);

            // Save images
            if (this.currentImages.length > 0) {
                for (const imageData of this.currentImages) {
                    await window.recipeStorage.saveImage(recipeId, imageData.file, imageData.data);
                }
            }

            this.closeModal(document.getElementById('add-recipe-modal'));
            await this.loadRecipes();
            await this.loadTags();

            this.showSuccess(this.editingRecipe ? 'Recipe updated successfully!' : 'Recipe saved successfully!');

        } catch (error) {
            console.error('Failed to save recipe:', error);
            this.showError('Failed to save recipe');
        }
    }

    /**
     * Share via mobile (Web Share API)
     */
    async shareViaMobile() {
        try {
            const data = await window.recipeSharing.exportForSharing();
            const success = await window.recipeSharing.shareViaWebAPI(data, 'My Vibe Recipe Collection');
            
            if (!success) {
                // Fallback: copy to clipboard
                await navigator.clipboard.writeText(data);
                this.showSuccess('Recipe data copied to clipboard! You can paste it in a message to share.');
            } else {
                this.showSuccess('Recipes shared successfully!');
            }
        } catch (error) {
            console.error('Mobile sharing failed:', error);
            this.showError('Sharing failed. Try the export option instead.');
        }
    }

    /**
     * Export recipes as downloadable file
     */
    async exportRecipes() {
        try {
            const data = await window.recipeSharing.exportForSharing();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `vibe-recipes-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showSuccess('Recipes exported successfully! Share this file with your partner.');
        } catch (error) {
            console.error('Export failed:', error);
            this.showError('Export failed. Please try again.');
        }
    }

    /**
     * Import recipes from file
     */
    async importRecipes(file) {
        try {
            const text = await file.text();
            const result = await window.recipeSharing.importSharedRecipes(text, 'add');
            
            this.hideShareModal();
            this.showSuccess(`Successfully imported ${result.recipesImported} recipes and ${result.imagesImported} images!`);
            
        } catch (error) {
            console.error('Import failed:', error);
            this.showError('Import failed. Please check the file format.');
        }
    }

    /**
     * Copy recipes to clipboard
     */
    async copyRecipesToClipboard() {
        try {
            const data = await window.recipeSharing.exportForSharing();
            await navigator.clipboard.writeText(data);
            
            const statusDiv = document.getElementById('copy-status');
            this.showStatus(statusDiv, 'Copied to clipboard! You can paste this in a message or email.', 'success');
            
        } catch (error) {
            console.error('Copy to clipboard failed:', error);
            const statusDiv = document.getElementById('copy-status');
            this.showStatus(statusDiv, 'Copy failed. Your browser may not support this feature.', 'error');
        }
    }

    /**
     * Get form data as recipe object
     */
    getRecipeFormData() {
        const tags = document.getElementById('recipe-tags').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);

        return {
            title: document.getElementById('recipe-title').value.trim(),
            ingredients: document.getElementById('recipe-ingredients').value.trim(),
            instructions: document.getElementById('recipe-instructions').value.trim(),
            cookingTime: parseInt(document.getElementById('cooking-time').value) || null,
            servings: parseInt(document.getElementById('servings').value) || null,
            tags: tags,
            images: [], // Images are handled separately
            sourceUrl: document.getElementById('recipe-url').value.trim() || ''
        };
    }

    /**
     * Populate form with recipe data
     */
    populateRecipeForm(recipe) {
        document.getElementById('recipe-title').value = recipe.title || '';
        document.getElementById('recipe-ingredients').value = recipe.ingredients || '';
        document.getElementById('recipe-instructions').value = recipe.instructions || '';
        document.getElementById('cooking-time').value = recipe.cookingTime || '';
        document.getElementById('servings').value = recipe.servings || '';
        document.getElementById('recipe-tags').value = recipe.tags ? recipe.tags.join(', ') : '';
        
        if (recipe.sourceUrl) {
            document.getElementById('recipe-url').value = recipe.sourceUrl;
        }
    }

    /**
     * Reset recipe form
     */
    resetRecipeForm() {
        document.getElementById('recipe-form').reset();
        document.getElementById('url-import-form').classList.add('hidden');
        document.getElementById('manual-entry-form').classList.add('hidden');
        document.getElementById('extraction-status').classList.add('hidden');
        this.currentImages = [];
        this.updateImagePreview();
    }

    /**
     * Setup image upload functionality
     */
    setupImageUpload() {
        const uploadArea = document.getElementById('image-upload-area');
        const fileInput = document.getElementById('recipe-images');

        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            this.handleImageFiles(e.target.files);
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleImageFiles(e.dataTransfer.files);
        });
    }

    /**
     * Handle uploaded image files
     */
    async handleImageFiles(files) {
        for (const file of files) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.currentImages.push({
                        file: file,
                        data: e.target.result
                    });
                    this.updateImagePreview();
                };
                reader.readAsDataURL(file);
            }
        }
    }

    /**
     * Update image preview
     */
    updateImagePreview() {
        const preview = document.getElementById('image-preview');
        
        if (this.currentImages.length === 0) {
            preview.innerHTML = '';
            return;
        }

        preview.innerHTML = this.currentImages.map((img, index) => `
            <div class="image-preview-item">
                <img src="${img.data}" alt="Recipe image">
                <button type="button" class="remove-image" onclick="recipeUI.removeImage(${index})">&times;</button>
            </div>
        `).join('');
    }

    /**
     * Remove image from preview
     */
    removeImage(index) {
        this.currentImages.splice(index, 1);
        this.updateImagePreview();
    }

    /**
     * Setup tag input with suggestions
     */
    setupTagInput() {
        const tagInput = document.getElementById('recipe-tags');
        const suggestions = document.getElementById('tag-suggestions');

        tagInput.addEventListener('input', () => {
            this.updateTagSuggestions();
        });
    }

    /**
     * Update tag suggestions
     */
    updateTagSuggestions() {
        const tagInput = document.getElementById('recipe-tags');
        const suggestions = document.getElementById('tag-suggestions');
        const currentTags = tagInput.value.split(',').map(tag => tag.trim().toLowerCase());
        const lastTag = currentTags[currentTags.length - 1];

        if (lastTag.length < 2) {
            suggestions.innerHTML = '';
            return;
        }

        const matchingTags = this.allTags.filter(tag => 
            tag.toLowerCase().includes(lastTag) && 
            !currentTags.includes(tag.toLowerCase())
        ).slice(0, 5);

        suggestions.innerHTML = matchingTags.map(tag => 
            `<span class="tag-suggestion" onclick="recipeUI.addTagSuggestion('${tag}')">${tag}</span>`
        ).join('');
    }

    /**
     * Add tag suggestion to input
     */
    addTagSuggestion(tag) {
        const tagInput = document.getElementById('recipe-tags');
        const currentTags = tagInput.value.split(',').map(t => t.trim()).filter(t => t);
        currentTags[currentTags.length - 1] = tag;
        tagInput.value = currentTags.join(', ') + ', ';
        document.getElementById('tag-suggestions').innerHTML = '';
        tagInput.focus();
    }

    /**
     * Update tag filter dropdown
     */
    updateTagFilter() {
        const select = document.getElementById('filter-tags');
        select.innerHTML = '<option value="">All Tags</option>' + 
            this.allTags.map(tag => `<option value="${tag}">${tag}</option>`).join('');
    }

    /**
     * Toggle search visibility
     */
    toggleSearch() {
        const searchContainer = document.getElementById('search-container');
        const searchInput = document.getElementById('search-input');
        
        searchContainer.classList.toggle('hidden');
        
        if (!searchContainer.classList.contains('hidden')) {
            searchInput.focus();
        } else {
            searchInput.value = '';
            this.performSearch('');
        }
    }

    /**
     * Perform search with current filters
     */
    async performSearch(query = null) {
        const searchQuery = query !== null ? query : document.getElementById('search-input').value;
        const selectedTags = Array.from(document.getElementById('filter-tags').selectedOptions)
            .map(option => option.value).filter(value => value);
        const maxTime = document.getElementById('filter-time').value;

        const filters = {
            tags: selectedTags,
            maxTime: maxTime ? parseInt(maxTime) : null
        };

        try {
            const results = await window.recipeStorage.searchRecipes(searchQuery, filters);
            this.renderRecipes(results);
        } catch (error) {
            console.error('Search failed:', error);
            this.showError('Search failed');
        }
    }

    /**
     * Modal management
     */
    showModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    closeModal(modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    hideAddRecipeModal() {
        this.closeModal(document.getElementById('add-recipe-modal'));
    }

    hideRecipeDetailModal() {
        this.closeModal(document.getElementById('recipe-detail-modal'));
    }

    hideShareModal() {
        this.closeModal(document.getElementById('share-modal'));
    }

    /**
     * Status and error handling
     */
    showStatus(element, message, type) {
        element.className = `status-message ${type}`;
        element.textContent = message;
        element.classList.remove('hidden');
    }

    showError(message) {
        alert('Error: ' + message);
    }

    showSuccess(message) {
        alert(message);
    }

    /**
     * Utility functions
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Create global UI instance
window.recipeUI = new RecipeUI();

// Global functions for onclick handlers
window.showAddRecipeModal = () => recipeUI.showAddRecipeModal();
window.hideAddRecipeModal = () => recipeUI.hideAddRecipeModal();
window.hideRecipeDetailModal = () => recipeUI.hideRecipeDetailModal();
window.hideShareModal = () => recipeUI.hideShareModal();