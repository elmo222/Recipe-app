/**
 * Main Application Entry Point
 * Initializes the Recipe Management App
 */

class RecipeApp {
    constructor() {
        this.isInitialized = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('Initializing Vibe Recipe App...');

            // Show loading state
            this.showLoadingState();

            // Initialize storage
            await window.recipeStorage.init();
            console.log('Storage initialized');

            // Initialize UI
            window.recipeUI.init();
            console.log('UI initialized');

            // Hide loading state
            this.hideLoadingState();

            this.isInitialized = true;
            console.log('App initialization complete');

            // Check if this is the first time using the app
            this.checkFirstTimeUser();

        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showInitializationError(error);
        }
    }

    /**
     * Show loading state during initialization
     */
    showLoadingState() {
        const loadingHtml = `
            <div id="app-loading" class="loading-overlay">
                <div class="loading-content">
                    <div class="loading-spinner">🍽️</div>
                    <h2>Loading Vibe Recipes...</h2>
                    <p>Setting up your recipe collection</p>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', loadingHtml);

        // Add loading styles
        const style = document.createElement('style');
        style.textContent = `
            .loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.95);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            }
            
            .loading-content {
                text-align: center;
                padding: 2rem;
            }
            
            .loading-spinner {
                font-size: 4rem;
                animation: spin 2s linear infinite;
                margin-bottom: 1rem;
            }
            
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            
            .loading-content h2 {
                color: var(--primary-color);
                margin-bottom: 0.5rem;
            }
            
            .loading-content p {
                color: var(--medium-gray);
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Hide loading state
     */
    hideLoadingState() {
        const loading = document.getElementById('app-loading');
        if (loading) {
            loading.remove();
        }
    }

    /**
     * Show initialization error
     */
    showInitializationError(error) {
        this.hideLoadingState();
        
        const errorHtml = `
            <div id="app-error" class="error-overlay">
                <div class="error-content">
                    <div class="error-icon">⚠️</div>
                    <h2>Failed to Initialize App</h2>
                    <p>There was a problem setting up the recipe app:</p>
                    <div class="error-message">${error.message}</div>
                    <button onclick="location.reload()" class="btn btn-primary">
                        Try Again
                    </button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', errorHtml);

        // Add error styles
        const style = document.createElement('style');
        style.textContent = `
            .error-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.95);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            }
            
            .error-content {
                text-align: center;
                padding: 2rem;
                max-width: 500px;
            }
            
            .error-icon {
                font-size: 4rem;
                margin-bottom: 1rem;
            }
            
            .error-content h2 {
                color: var(--accent-color);
                margin-bottom: 1rem;
            }
            
            .error-message {
                background: #f8d7da;
                color: #721c24;
                padding: 1rem;
                border-radius: 0.5rem;
                margin: 1rem 0;
                font-family: monospace;
                font-size: 0.9rem;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Check if this is a first-time user and show welcome
     */
    async checkFirstTimeUser() {
        try {
            const recipes = await window.recipeStorage.getAllRecipes();
            
            if (recipes.length === 0) {
                setTimeout(() => {
                    this.showWelcomeMessage();
                }, 1000);
            }
        } catch (error) {
            console.warn('Could not check first-time user status:', error);
        }
    }

    /**
     * Show welcome message for new users
     */
    showWelcomeMessage() {
        const welcomeHtml = `
            <div id="welcome-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Welcome to Vibe Recipes! 🍽️</h2>
                    </div>
                    <div class="modal-body">
                        <div class="welcome-content">
                            <p>Your personal recipe collection starts here. With Vibe Recipes, you can:</p>
                            
                            <ul class="welcome-features">
                                <li><strong>📱 Import from URLs</strong> - Paste any recipe URL and we'll extract the details automatically</li>
                                <li><strong>🏷️ Smart Tagging</strong> - Organize recipes with custom tags for easy searching</li>
                                <li><strong>📷 Photo Gallery</strong> - Add multiple photos to each recipe</li>
                                <li><strong>⏱️ Track Details</strong> - Keep track of cooking time and servings</li>
                                <li><strong>🔍 Powerful Search</strong> - Find recipes by name, ingredients, or tags</li>
                            </ul>
                            
                            <div class="welcome-actions">
                                <button class="btn btn-primary" onclick="app.startFirstRecipe()">
                                    Add Your First Recipe
                                </button>
                                <button class="btn btn-secondary" onclick="app.closeWelcome()">
                                    Explore the App
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', welcomeHtml);

        // Add welcome styles
        const style = document.createElement('style');
        style.textContent = `
            .welcome-content {
                text-align: left;
            }
            
            .welcome-features {
                margin: 1.5rem 0;
                padding-left: 1rem;
            }
            
            .welcome-features li {
                margin-bottom: 0.75rem;
                line-height: 1.5;
            }
            
            .welcome-actions {
                display: flex;
                gap: 1rem;
                justify-content: center;
                margin-top: 2rem;
            }
            
            @media (max-width: 768px) {
                .welcome-actions {
                    flex-direction: column;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Start adding first recipe
     */
    startFirstRecipe() {
        this.closeWelcome();
        window.recipeUI.showAddRecipeModal();
    }

    /**
     * Close welcome modal
     */
    closeWelcome() {
        const welcome = document.getElementById('welcome-modal');
        if (welcome) {
            welcome.remove();
        }
    }

    /**
     * Handle app errors gracefully
     */
    handleError(error, context = 'Unknown') {
        console.error(`App Error (${context}):`, error);
        
        // You could implement more sophisticated error handling here
        // such as error reporting, user notifications, etc.
    }

    /**
     * Get app information
     */
    getAppInfo() {
        return {
            name: 'Vibe Recipes',
            version: '1.0.0',
            description: 'Simple, clean recipe manager with URL import and tagging',
            author: 'Vibe Recipe Team',
            initialized: this.isInitialized
        };
    }

    /**
     * Export app data
     */
    async exportData() {
        try {
            const data = await window.recipeStorage.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { 
                type: 'application/json' 
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `vibe-recipes-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return true;
        } catch (error) {
            this.handleError(error, 'Export Data');
            throw error;
        }
    }

    /**
     * Import app data
     */
    async importData(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            await window.recipeStorage.importData(data);
            await window.recipeUI.loadRecipes();
            await window.recipeUI.loadTags();
            
            return true;
        } catch (error) {
            this.handleError(error, 'Import Data');
            throw error;
        }
    }

    /**
     * Clear all app data
     */
    async clearAllData() {
        if (confirm('Are you sure you want to delete all recipes? This cannot be undone.')) {
            try {
                await window.recipeStorage.clearAllData();
                await window.recipeUI.loadRecipes();
                await window.recipeUI.loadTags();
                return true;
            } catch (error) {
                this.handleError(error, 'Clear Data');
                throw error;
            }
        }
        return false;
    }
}

// Create global app instance
window.app = new RecipeApp();

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app.init();
});

// Handle app visibility changes (for potential future features)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && window.app.isInitialized) {
        // App became visible - could refresh data here if needed
        console.log('App became visible');
    }
});

// Handle beforeunload for potential data saving
window.addEventListener('beforeunload', (e) => {
    // Could implement auto-save or warn about unsaved changes here
    // For now, just log
    console.log('App is closing');
});

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    if (window.app) {
        window.app.handleError(e.error, 'Global');
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    if (window.app) {
        window.app.handleError(e.reason, 'Promise Rejection');
    }
});

console.log('Vibe Recipe App loaded successfully');