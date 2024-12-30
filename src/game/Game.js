import * as THREE from 'three';
import { Player } from './Player';
import { Floor } from './Floor';

export class Game {
    constructor() {
        // Show start menu first, don't initialize game yet
        this.showStartMenu();
    }

    showStartMenu() {
        // Create menu container
        const menuContainer = document.createElement('div');
        menuContainer.style.position = 'fixed';
        menuContainer.style.top = '50%';
        menuContainer.style.left = '50%';
        menuContainer.style.transform = 'translate(-50%, -50%)';
        menuContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        menuContainer.style.padding = '40px';
        menuContainer.style.borderRadius = '10px';
        menuContainer.style.textAlign = 'center';
        menuContainer.style.zIndex = '2000';
        menuContainer.style.minWidth = '300px';

        // Add title
        const title = document.createElement('h1');
        title.textContent = 'Welcome to the Game';
        title.style.color = 'white';
        title.style.marginBottom = '30px';
        title.style.fontSize = '24px';
        title.style.fontFamily = 'Arial, sans-serif';

        // Add code input
        const codeInput = document.createElement('input');
        codeInput.type = 'text';
        codeInput.placeholder = 'Enter Code';
        codeInput.style.padding = '10px';
        codeInput.style.fontSize = '16px';
        codeInput.style.width = '80%';
        codeInput.style.marginBottom = '20px';
        codeInput.style.borderRadius = '5px';
        codeInput.style.border = 'none';
        codeInput.style.textAlign = 'center';

        // Add enter button
        const enterButton = document.createElement('button');
        enterButton.textContent = 'Enter';
        enterButton.style.padding = '10px 30px';
        enterButton.style.fontSize = '18px';
        enterButton.style.backgroundColor = '#4CAF50';
        enterButton.style.color = 'white';
        enterButton.style.border = 'none';
        enterButton.style.borderRadius = '5px';
        enterButton.style.cursor = 'pointer';
        enterButton.style.width = '80%';

        // Handle code verification
        const handleEnter = () => {
            if (codeInput.value.toLowerCase() === 'tolgaayan') {
                document.body.removeChild(menuContainer);
                this.initializeGame();
            } else {
                codeInput.value = '';  // Clear input if code is wrong
                codeInput.placeholder = 'Incorrect Code';
                setTimeout(() => {
                    codeInput.placeholder = 'Enter Code';
                }, 1500);
            }
        };

        // Add event listeners
        enterButton.addEventListener('click', handleEnter);
        codeInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                handleEnter();
            }
        });

        // Assemble menu
        menuContainer.appendChild(title);
        menuContainer.appendChild(codeInput);
        menuContainer.appendChild(enterButton);
        document.body.appendChild(menuContainer);
    }

    initializeGame() {
        // Create basic Three.js setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.score = 0;
        this.clock = new THREE.Clock();
        this.floor = null;
        this.isPaused = false;
        this.deathMenu = null;

        // Initialize game
        this.initialize();
        this.createGradientBackground();
        this.addDeathTestButton();
    }

    initialize() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById('game-container').appendChild(this.renderer.domElement);

        // Setup camera
        this.camera.position.set(0, 0, 20);
        this.camera.lookAt(0, 0, 0);

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(ambientLight, directionalLight);

        // Setup event listeners
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // Create floor with larger dimensions
        this.floor = new Floor(this, '/assets/floor/stone.png', 3, 2.5);
        
        // Create player with camera reference and lower starting position
        this.player = new Player(this);
        this.player.setPosition(0, 2, -5);

        // Update keyboard listeners
        document.addEventListener('keydown', (event) => {
            switch(event.code) {
                case 'Space':
                    this.player.jump();
                    break;
                case 'KeyA':
                    this.player.startMoving('left');
                    break;
                case 'KeyD':
                    this.player.startMoving('right');
                    break;
            }
        });

        document.addEventListener('keyup', (event) => {
            switch(event.code) {
                case 'KeyA':
                    this.player.stopMoving('left');
                    break;
                case 'KeyD':
                    this.player.stopMoving('right');
                    break;
            }
        });

        // Add edit button
        const editButton = document.createElement('button');
        editButton.innerHTML = 'Edit';
        editButton.style.position = 'fixed';
        editButton.style.top = '20px';
        editButton.style.right = '20px';
        editButton.style.padding = '10px 20px';
        editButton.style.backgroundColor = '#4CAF50';
        editButton.style.color = 'white';
        editButton.style.border = 'none';
        editButton.style.borderRadius = '5px';
        editButton.style.cursor = 'pointer';
        editButton.style.zIndex = '1000';
        document.body.appendChild(editButton);

        let isEditMode = false;
        let isDragging = false;
        let dragStartY = 0;
        let dragStartX = 0;
        let floorStartY = 0;
        let floorStartX = 0;

        // Edit button click handler
        editButton.addEventListener('click', () => {
            isEditMode = !isEditMode;
            editButton.style.backgroundColor = isEditMode ? '#f44336' : '#4CAF50';
            editButton.innerHTML = isEditMode ? 'Done' : 'Edit';
            
            // Toggle floor outline
            this.floor.toggleOutline(isEditMode);
        });

        // Mouse event handlers for floor dragging
        this.renderer.domElement.addEventListener('mousedown', (event) => {
            if (!isEditMode) return;
            
            // Convert mouse coordinates to world coordinates
            const rect = this.renderer.domElement.getBoundingClientRect();
            const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            const mouseWorldY = (mouseY * (this.camera.position.z / 2));
            const mouseWorldX = (mouseX * (this.camera.position.z / 2));
            
            // Check if mouse is near the floor
            const floorY = this.floor.blocks[0].position.y;
            const floorX = this.floor.blocks[0].position.x;
            if (Math.abs(mouseWorldY - floorY) < 3) {
                isDragging = true;
                dragStartY = mouseY;
                dragStartX = mouseX;
                floorStartY = floorY;
                floorStartX = floorX;
            }
        });

        this.renderer.domElement.addEventListener('mousemove', (event) => {
            if (!isDragging) return;
            
            const rect = this.renderer.domElement.getBoundingClientRect();
            const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            const deltaY = mouseY - dragStartY;
            const deltaX = mouseX - dragStartX;
            
            // Update floor position with both X and Y movement
            this.floor.blocks.forEach((block, index) => {
                const originalXOffset = index * this.floor.width;
                block.position.y = floorStartY + (deltaY * 5);
                block.position.x = floorStartX + (deltaX * 10) + originalXOffset;
            });

            // Update outline positions if they exist
            if (this.floor.outlineObjects.length > 0) {
                this.floor.outlineObjects.forEach((outline, index) => {
                    outline.position.copy(this.floor.blocks[index].position);
                });
            }
        });

        this.renderer.domElement.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                // Save both X and Y positions
                localStorage.setItem('floorPositionY', this.floor.blocks[0].position.y);
                localStorage.setItem('floorPositionX', this.floor.blocks[0].position.x);
            }
        });

        // Load saved floor position (both X and Y)
        const savedPositionY = localStorage.getItem('floorPositionY');
        const savedPositionX = localStorage.getItem('floorPositionX');
        if (savedPositionY !== null && savedPositionX !== null) {
            this.floor.blocks.forEach((block, index) => {
                const originalXOffset = index * this.floor.width;
                block.position.y = parseFloat(savedPositionY);
                block.position.x = parseFloat(savedPositionX) + originalXOffset;
            });
        }

        // Start game loop
        this.animate();
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    updateScore() {
        this.score += 1;
        document.getElementById('score-value').textContent = this.score;
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        if (!this.isPaused) {
            const deltaTime = this.clock.getDelta();
            
            if (this.player) {
                const isOnFloor = this.floor && this.floor.checkCollision(this.player.position, this.player.velocity);
                this.player.update(deltaTime, isOnFloor);
            }
        }
        
        this.renderer.render(this.scene, this.camera);
    }

    createGradientBackground() {
        const textureLoader = new THREE.TextureLoader();
        
        textureLoader.load(
            '/assets/images/medieval-background.png',
            (texture) => {
                this.createBackgroundPlane(texture);
                console.log('Background loaded successfully');
            },
            undefined,
            (error) => {
                console.error('Failed to load background image:', error);
            }
        );
    }

    // Replace createBackgroundSphere with createBackgroundPlane
    createBackgroundPlane(texture) {
        // Create a group for background and its effects
        const backgroundGroup = new THREE.Group();
        backgroundGroup.position.z = -10;

        // Calculate aspect ratios
        const screenAspectRatio = window.innerWidth / window.innerHeight;
        const imageAspectRatio = 1920 / 1080;
        
        // Base height and calculate width to cover screen
        const height = 2;
        let width = height * Math.max(imageAspectRatio, screenAspectRatio);

        // Create a plane geometry
        const geometry = new THREE.PlaneGeometry(width, height);
        
        // Background material
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 1
        });
        
        const backgroundMesh = new THREE.Mesh(geometry, material);
        
        // Make sure the plane faces the camera directly
        backgroundMesh.rotation.set(0, 0, 0);
        
        // Calculate scale to fill screen
        const distance = this.camera.position.z - backgroundGroup.position.z;
        const fov = this.camera.fov * (Math.PI / 180);
        const planeHeight = 2 * Math.tan(fov / 2) * distance;
        const scale = planeHeight / height;
        
        // Apply scale
        backgroundMesh.scale.set(scale, scale, 1);

        // Add white tint overlay with same dimensions
        const whiteTintGeometry = new THREE.PlaneGeometry(width, height);
        const whiteTintMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.2
        });
        
        const whiteTintMesh = new THREE.Mesh(whiteTintGeometry, whiteTintMaterial);
        whiteTintMesh.scale.copy(backgroundMesh.scale);
        whiteTintMesh.position.z = 0.01;

        // Add meshes to group
        backgroundGroup.add(backgroundMesh);
        backgroundGroup.add(whiteTintMesh);

        // Add group to scene
        this.scene.add(backgroundGroup);

        // Add resize handler to update background size
        window.addEventListener('resize', () => {
            const newScreenAspectRatio = window.innerWidth / window.innerHeight;
            const newWidth = height * Math.max(imageAspectRatio, newScreenAspectRatio);
            backgroundMesh.scale.x = (newWidth / width) * scale;
            whiteTintMesh.scale.x = backgroundMesh.scale.x;
        });
    }

    addDeathTestButton() {
        const deathButton = document.createElement('button');
        deathButton.innerHTML = 'Die';
        deathButton.style.position = 'fixed';
        deathButton.style.top = '20px';
        deathButton.style.right = '100px';  // Position it to the left of edit button
        deathButton.style.padding = '10px 20px';
        deathButton.style.backgroundColor = '#ff4444';
        deathButton.style.color = 'white';
        deathButton.style.border = 'none';
        deathButton.style.borderRadius = '5px';
        deathButton.style.cursor = 'pointer';
        deathButton.style.zIndex = '1000';
        
        deathButton.addEventListener('click', () => {
            if (!this.player.isDead) {
                this.player.die();
            }
        });
        
        document.body.appendChild(deathButton);
    }

    showDeathMenu() {
        this.isPaused = true;

        // Create menu container
        const menuContainer = document.createElement('div');
        menuContainer.style.position = 'fixed';
        menuContainer.style.top = '50%';
        menuContainer.style.left = '50%';
        menuContainer.style.transform = 'translate(-50%, -50%)';
        menuContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        menuContainer.style.padding = '40px';
        menuContainer.style.borderRadius = '10px';
        menuContainer.style.textAlign = 'center';
        menuContainer.style.zIndex = '2000';

        // Add death message
        const deathMessage = document.createElement('h2');
        deathMessage.textContent = 'YOU ARE DEAD';
        deathMessage.style.color = 'white';
        deathMessage.style.marginBottom = '30px';
        deathMessage.style.fontSize = '24px';
        deathMessage.style.fontFamily = 'Arial, sans-serif';

        // Add restart button
        const restartButton = document.createElement('button');
        restartButton.textContent = 'Restart';
        restartButton.style.padding = '10px 30px';
        restartButton.style.fontSize = '18px';
        restartButton.style.backgroundColor = '#4CAF50';
        restartButton.style.color = 'white';
        restartButton.style.border = 'none';
        restartButton.style.borderRadius = '5px';
        restartButton.style.cursor = 'pointer';

        restartButton.addEventListener('click', () => this.restartGame());
        
        menuContainer.appendChild(deathMessage);
        menuContainer.appendChild(restartButton);
        document.body.appendChild(menuContainer);
        
        this.deathMenu = menuContainer;
    }

    restartGame() {
        // Remove death menu
        if (this.deathMenu) {
            document.body.removeChild(this.deathMenu);
            this.deathMenu = null;
        }

        // Clear the scene
        while(this.scene.children.length > 0) { 
            this.scene.remove(this.scene.children[0]); 
        }

        // Re-add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(ambientLight, directionalLight);

        // Recreate background
        this.createGradientBackground();

        // Recreate floor
        this.floor = new Floor(this, '/assets/floor/stone.png', 3, 2.5);

        // Recreate player with lower starting position
        this.player = new Player(this);
        this.player.setPosition(0, 2, -5);

        // Reset game state
        this.isPaused = false;
        this.clock.start();
    }
} 