import * as THREE from 'three';

export class Floor {
    constructor(scene, textureUrl, width = 2, height = 1.5) {
        this.scene = scene.scene;
        this.camera = scene.camera;
        this.blocks = [];
        this.width = width;
        this.height = height;
        this.outlineObjects = [];
        
        // Create floor immediately with a solid color
        this.createFloor(null);
        
        // Then try to load texture
        this.loadTexture(textureUrl);
    }

    loadTexture(textureUrl) {
        const textureLoader = new THREE.TextureLoader();
        console.log('Attempting to load texture from:', textureUrl);
        
        // Try with and without leading slash
        const pathToTry = textureUrl.startsWith('/') ? textureUrl.substring(1) : textureUrl;
        
        textureLoader.load(
            pathToTry,
            (texture) => {
                console.log('Floor texture loaded successfully!');
                texture.magFilter = THREE.NearestFilter;
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(1, 1);
                
                // Update all block materials with the loaded texture
                this.blocks.forEach(block => {
                    block.material = new THREE.MeshBasicMaterial({
                        map: texture,
                        side: THREE.DoubleSide,
                        transparent: true
                    });
                    block.material.needsUpdate = true;
                });
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            (error) => {
                console.error('Error loading texture:', error);
                console.error('Attempted path:', pathToTry);
                // Try to fetch the file directly to check if it's accessible
                fetch(pathToTry)
                    .then(response => console.log('File is accessible:', response.ok))
                    .catch(err => console.error('File is not accessible:', err));
            }
        );
    }

    createFloor(texture) {
        // Calculate screen dimensions
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // Convert to world coordinates
        const cameraZ = this.camera.position.z;
        const vFov = this.camera.fov * Math.PI / 180;
        const worldHeight = 2 * Math.tan(vFov / 2) * cameraZ;
        const worldWidth = worldHeight * (screenWidth / screenHeight);
        
        // Create more blocks to ensure full coverage
        const blocksNeeded = Math.ceil(worldWidth / this.width) + 6;

        // Get saved positions or use defaults
        const savedPositionY = localStorage.getItem('floorPositionY');
        const savedPositionX = localStorage.getItem('floorPositionX');
        const bottomPosition = savedPositionY !== null ? 
            parseFloat(savedPositionY) - this.height/2 : 
            -worldHeight/2 - 2.5;
        const startX = savedPositionX !== null ?
            parseFloat(savedPositionX) :
            -worldWidth / 2;

        // Create blocks
        for (let i = 0; i < blocksNeeded; i++) {
            const geometry = new THREE.PlaneGeometry(this.width, this.height);
            const material = new THREE.MeshBasicMaterial({
                color: 0x4b3621,
                side: THREE.DoubleSide,
                transparent: true
            });
            
            const block = new THREE.Mesh(geometry, material);
            
            // Position blocks with saved X position
            const xPos = startX + (i * this.width);
            block.position.set(xPos, bottomPosition + (this.height/2), -5);
            
            block.rotation.set(0, 0, 0);
            
            this.blocks.push(block);
            this.scene.add(block);
        }

        // After creating blocks, create initial outline (hidden)
        this.toggleOutline(false);
    }

    toggleOutline(show) {
        // Remove existing outline if any
        this.outlineObjects.forEach(outline => this.scene.remove(outline));
        this.outlineObjects = [];

        if (show) {
            // Create outline for each block
            this.blocks.forEach(block => {
                const outlineGeometry = new THREE.PlaneGeometry(
                    this.width + 0.1,  // Slightly larger than block
                    this.height + 0.1
                );
                const outlineMaterial = new THREE.MeshBasicMaterial({
                    color: 0xffff00,  // Yellow outline
                    side: THREE.DoubleSide,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.8
                });
                
                const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
                outline.position.copy(block.position);
                outline.position.z = block.position.z + 0.01;  // Slightly in front
                outline.rotation.copy(block.rotation);
                
                this.outlineObjects.push(outline);
                this.scene.add(outline);
            });
        }
    }

    checkCollision(playerPosition, playerVelocity) {
        for (const block of this.blocks) {
            const blockBounds = {
                left: block.position.x - this.width/2,
                right: block.position.x + this.width/2,
                top: block.position.y + this.height/2,
                bottom: block.position.y - this.height/2
            };

            if (playerPosition.x >= blockBounds.left && 
                playerPosition.x <= blockBounds.right && 
                playerPosition.y >= blockBounds.bottom &&
                playerPosition.y <= blockBounds.top) {
                return true;
            }
        }
        return false;
    }
} 