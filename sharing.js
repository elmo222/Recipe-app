/**
 * Recipe Sharing System
 * Handles data synchronization between devices
 */

class RecipeSharing {
    constructor() {
        this.syncKey = 'vibe-recipes-sync';
    }

    /**
     * Export recipes as shareable JSON
     */
    async exportForSharing() {
        try {
            const data = await window.recipeStorage.exportData();
            
            // Create a shareable format
            const shareData = {
                ...data,
                sharedAt: new Date().toISOString(),
                deviceInfo: {
                    userAgent: navigator.userAgent,
                    platform: navigator.platform,
                    language: navigator.language
                }
            };

            return JSON.stringify(shareData, null, 2);
        } catch (error) {
            console.error('Export for sharing failed:', error);
            throw error;
        }
    }

    /**
     * Import shared recipes
     */
    async importSharedRecipes(jsonData, mergeMode = 'add') {
        try {
            const shareData = JSON.parse(jsonData);
            
            if (mergeMode === 'replace') {
                // Clear existing data first
                await window.recipeStorage.clearAllData();
            }

            // Import the shared recipes
            await window.recipeStorage.importData(shareData);
            
            // Refresh UI
            await window.recipeUI.loadRecipes();
            await window.recipeUI.loadTags();

            return {
                success: true,
                recipesImported: shareData.recipes.length,
                imagesImported: shareData.images.length
            };
        } catch (error) {
            console.error('Import shared recipes failed:', error);
            throw error;
        }
    }

    /**
     * Generate QR code for easy sharing (using QR code API)
     */
    async generateQRCode(data) {
        try {
            // Use a free QR code API
            const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data)}`;
            return qrApiUrl;
        } catch (error) {
            console.error('QR code generation failed:', error);
            return null;
        }
    }

    /**
     * Share via Web Share API (mobile browsers)
     */
    async shareViaWebAPI(data, title = 'My Recipe Collection') {
        if (navigator.share) {
            try {
                // Create a blob for the data
                const blob = new Blob([data], { type: 'application/json' });
                const file = new File([blob], 'vibe-recipes.json', { type: 'application/json' });

                await navigator.share({
                    title: title,
                    text: 'Check out my recipe collection from Vibe Recipes!',
                    files: [file]
                });

                return true;
            } catch (error) {
                console.error('Web Share API failed:', error);
                return false;
            }
        }
        return false;
    }

    /**
     * Create shareable link (using cloud storage services)
     */
    async createShareableLink(data) {
        // This would integrate with services like:
        // - Google Drive API
        // - Dropbox API  
        // - GitHub Gist
        // For now, we'll provide instructions for manual sharing
        
        return {
            method: 'manual',
            instructions: [
                '1. Copy the exported JSON data',
                '2. Save it to a cloud service (Google Drive, Dropbox, etc.)',
                '3. Share the link with your partner',
                '4. They can download and import the file'
            ]
        };
    }

    /**
     * Setup automatic sync (future feature)
     */
    setupAutoSync(syncService = 'manual') {
        // This could integrate with:
        // - Firebase Realtime Database
        // - Supabase
        // - PocketBase
        // - Or any other real-time sync service
        
        console.log('Auto-sync setup for future implementation');
        return {
            status: 'planned',
            message: 'Automatic sync is planned for future versions'
        };
    }
}

// Create global sharing instance
window.recipeSharing = new RecipeSharing();