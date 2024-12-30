import * as THREE from 'three';

export class Player {
    constructor(game) {
        this.game = game;
        this.scene = game.scene;
        this.camera = game.camera;
        
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.position = new THREE.Vector3(0, 2, -5);
        this.gravity = -20;
        this.moveSpeed = 5;
        this.isGrounded = false;
        this.currentFrame = 0;
        this.frameTime = 0;
        this.animationSpeed = 0.1;
        this.attackSpeed = 0.05;
        this.deathSpeed = 0.15;
        this.isJumping = false;
        this.isWalking = false;
        this.facingRight = true;
        this.lastLookedDirection = 'right';
        this.isOnAir = false;
        
        // Texture arrays
        this.idleTexturesRight = [];
        this.idleTexturesLeft = [];
        this.jumpTexturesRight = [];
        this.jumpTexturesLeft = [];
        this.walkTexturesRight = [];
        this.walkTexturesLeft = [];
        this.attackTexturesRight = [];
        this.attackTexturesLeft = [];
        
        // Attack properties
        this.isAttacking = false;
        this.attackFrame = 0;
        this.attackDirection = 'right';
        
        this.movement = {
            left: false,
            right: false
        };

        // Add jump attack textures
        this.jumpAttackTexturesRight = [];
        this.jumpAttackTexturesLeft = [];
        
        // Add run textures and state
        this.runTexturesRight = [];
        this.runTexturesLeft = [];
        this.isRunning = false;
        this.baseSpeed = 3;  // Changed from 5 to 3 for slower walking
        this.moveSpeed = this.baseSpeed;
        
        // Add shift key state
        this.isShiftPressed = false;
        
        // Add shift key listeners with reduced run multiplier
        document.addEventListener('keydown', (event) => {
            if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
                this.isShiftPressed = true;
                this.moveSpeed = this.baseSpeed * 1.3;  // Changed from 1.5 to 1.3 for slightly slower running
            }
        });
        
        document.addEventListener('keyup', (event) => {
            if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
                this.isShiftPressed = false;
                this.moveSpeed = this.baseSpeed;
            }
        });
        
        // Add death properties
        this.deadTexturesRight = [];
        this.deadTexturesLeft = [];
        this.isDead = false;
        this.deathFrame = 0;
        this.deathAnimationComplete = false;
        
        this.loadTextures();
        
        // Add mouse click listener for attacks
        document.addEventListener('click', (event) => this.handleAttack(event));
    }

    setPosition(x, y, z) {
        this.position.set(x, y, z);
        if (this.sprite) {
            this.sprite.position.copy(this.position);
        }
    }

    loadTextures() {
        const textureLoader = new THREE.TextureLoader();
        
        console.log('Initial player position:', this.position);
        
        // Load idle animations (right-facing)
        for (let i = 1; i <= 10; i++) {
            const texture = textureLoader.load(
                `/assets/character/Idle (${i}).png`,
                (texture) => {
                    console.log(`Loaded Idle ${i}`);
                    if (i === 1 && this.sprite) {
                        this.sprite.material.needsUpdate = true;
                    }
                },
                undefined,
                (error) => console.error(`Error loading Idle ${i}:`, error)
            );
            texture.magFilter = THREE.NearestFilter;
            this.idleTexturesRight.push(texture);
        }

        // Create left-facing idle animations
        this.idleTexturesLeft = this.idleTexturesRight.map(texture => {
            const leftTexture = texture.clone();
            leftTexture.repeat.x = -1;
            leftTexture.offset.x = 1;
            return leftTexture;
        });

        // Load jump animations (right-facing)
        this.jumpTexturesRight = [];
        for (let i = 1; i <= 10; i++) {
            const texture = textureLoader.load(
                `/assets/character/Jump (${i}).png`,
                (texture) => console.log(`Loaded Jump ${i}`),
                undefined,
                (error) => console.error(`Error loading Jump ${i}:`, error)
            );
            texture.magFilter = THREE.NearestFilter;
            this.jumpTexturesRight.push(texture);
        }

        // Create left-facing jump animations
        this.jumpTexturesLeft = this.jumpTexturesRight.map(texture => {
            const leftTexture = texture.clone();
            leftTexture.repeat.x = -1;  // Flip horizontally
            leftTexture.offset.x = 1;   // Adjust offset to compensate for flipping
            return leftTexture;
        });

        // Replace run animations with walk animations
        this.walkTexturesRight = [];
        for (let i = 1; i <= 10; i++) {
            const texture = textureLoader.load(
                `/assets/character/Walk (${i}).png`,
                (texture) => console.log(`Loaded Walk ${i}`),
                undefined,
                (error) => console.error(`Error loading Walk ${i}:`, error)
            );
            texture.magFilter = THREE.NearestFilter;
            this.walkTexturesRight.push(texture);
        }

        // Create left-facing walk animations
        this.walkTexturesLeft = this.walkTexturesRight.map(texture => {
            const leftTexture = texture.clone();
            leftTexture.repeat.x = -1;
            leftTexture.offset.x = 1;
            return leftTexture;
        });

        // Load attack animations (right-facing)
        for (let i = 1; i <= 10; i++) {
            const texture = textureLoader.load(
                `/assets/character/Attack (${i}).png`,
                (texture) => console.log(`Loaded Attack ${i}`),
                undefined,
                (error) => console.error(`Error loading Attack ${i}:`, error)
            );
            texture.magFilter = THREE.NearestFilter;
            this.attackTexturesRight.push(texture);
        }

        // Create left-facing attack animations
        this.attackTexturesLeft = this.attackTexturesRight.map(texture => {
            const leftTexture = texture.clone();
            leftTexture.repeat.x = -1;
            leftTexture.offset.x = 1;
            return leftTexture;
        });

        // Load jump attack animations (right-facing)
        for (let i = 1; i <= 10; i++) {
            const texture = textureLoader.load(
                `/assets/character/JumpAttack (${i}).png`,
                (texture) => console.log(`Loaded JumpAttack ${i}`),
                undefined,
                (error) => console.error(`Error loading JumpAttack ${i}:`, error)
            );
            texture.magFilter = THREE.NearestFilter;
            this.jumpAttackTexturesRight.push(texture);
        }

        // Create left-facing jump attack animations
        this.jumpAttackTexturesLeft = this.jumpAttackTexturesRight.map(texture => {
            const leftTexture = texture.clone();
            leftTexture.repeat.x = -1;
            leftTexture.offset.x = 1;
            return leftTexture;
        });

        // Load run animations (right-facing)
        for (let i = 1; i <= 10; i++) {
            const texture = textureLoader.load(
                `/assets/character/Run (${i}).png`,
                (texture) => console.log(`Loaded Run ${i}`),
                undefined,
                (error) => console.error(`Error loading Run ${i}:`, error)
            );
            texture.magFilter = THREE.NearestFilter;
            this.runTexturesRight.push(texture);
        }

        // Create left-facing run animations
        this.runTexturesLeft = this.runTexturesRight.map(texture => {
            const leftTexture = texture.clone();
            leftTexture.repeat.x = -1;
            leftTexture.offset.x = 1;
            return leftTexture;
        });

        // Load death animations (right-facing)
        for (let i = 1; i <= 10; i++) {
            const texture = textureLoader.load(
                `/assets/character/Dead (${i}).png`,
                (texture) => console.log(`Loaded Dead ${i}`),
                undefined,
                (error) => console.error(`Error loading Dead ${i}:`, error)
            );
            texture.magFilter = THREE.NearestFilter;
            this.deadTexturesRight.push(texture);
        }

        // Create left-facing death animations
        this.deadTexturesLeft = this.deadTexturesRight.map(texture => {
            const leftTexture = texture.clone();
            leftTexture.repeat.x = -1;
            leftTexture.offset.x = 1;
            return leftTexture;
        });

        // Create the sprite with the first idle texture
        const material = new THREE.SpriteMaterial({ 
            map: this.idleTexturesRight[0],
            transparent: true,
            sizeAttenuation: true
        });
        
        this.sprite = new THREE.Sprite(material);
        this.sprite.scale.set(3, 3, 1);
        this.sprite.position.copy(this.position);
        this.scene.add(this.sprite);
        
        console.log('Sprite created at position:', this.sprite.position);
    }

    startMoving(direction) {
        this.movement[direction] = true;
        this.isWalking = true;
        this.facingRight = direction === 'right';
        this.lastLookedDirection = direction;
        
        // Set speed based on shift key
        this.moveSpeed = this.isShiftPressed ? this.baseSpeed * 1.5 : this.baseSpeed;
    }

    stopMoving(direction) {
        this.movement[direction] = false;
        if (!this.movement.left && !this.movement.right) {
            this.isWalking = false;
        }
    }

    update(deltaTime, isOnFloor) {
        if (this.isDead) {
            // Update death animation with slower speed
            this.frameTime += deltaTime;
            if (this.frameTime >= this.deathSpeed && !this.deathAnimationComplete) {
                this.frameTime = 0;
                const deadTextures = this.lastLookedDirection === 'right' ? 
                    this.deadTexturesRight : 
                    this.deadTexturesLeft;
                
                this.sprite.material.map = deadTextures[this.deathFrame];
                
                this.deathFrame++;
                if (this.deathFrame >= 10) {
                    this.deathAnimationComplete = true;
                    this.game.showDeathMenu();
                }
            }
            return;
        }

        // Update air state
        this.isOnAir = this.isJumping || !isOnFloor;

        // Handle horizontal movement based on state
        this.velocity.x = 0;
        
        // Only allow movement during attack if in air
        const canMove = !this.isAttacking || this.isOnAir;
        
        if (canMove) {
            if (this.movement.left) {
                this.velocity.x = -this.moveSpeed;
                if (!this.isAttacking) {  // Only update direction if not attacking
                    this.lastLookedDirection = 'left';
                }
            }
            if (this.movement.right) {
                this.velocity.x = this.moveSpeed;
                if (!this.isAttacking) {  // Only update direction if not attacking
                    this.lastLookedDirection = 'right';
                }
            }
        }

        // Apply gravity if not on floor
        if (!isOnFloor) {
            this.velocity.y += this.gravity * deltaTime;
        } else if (this.velocity.y < 0) { // If falling and hit floor
            this.velocity.y = 0;
            this.isGrounded = true;
            this.isJumping = false;
        }

        // Update position
        const movement = new THREE.Vector3(
            this.velocity.x * deltaTime,
            this.velocity.y * deltaTime,
            this.velocity.z * deltaTime
        );
        this.position.add(movement);

        // Update sprite position
        this.sprite.position.copy(this.position);
        
        // Flip sprite based on attack direction or movement direction
        const facingDirection = this.isAttacking ? 
            this.attackDirection === 'right' : 
            this.lastLookedDirection === 'right';
        this.sprite.scale.x = Math.abs(this.sprite.scale.x) * (facingDirection ? 1 : -1);

        // Update animation with different speeds for attack
        this.frameTime += deltaTime;
        if (this.frameTime >= (this.isAttacking ? this.attackSpeed : this.animationSpeed)) {
            this.frameTime = 0;
            
            if (this.isAttacking) {
                // Choose between ground attack and jump attack animations
                const attackTextures = this.isOnAir ?
                    (this.attackDirection === 'right' ? this.jumpAttackTexturesRight : this.jumpAttackTexturesLeft) :
                    (this.attackDirection === 'right' ? this.attackTexturesRight : this.attackTexturesLeft);
                
                this.sprite.material.map = attackTextures[this.attackFrame];
                
                this.attackFrame++;
                if (this.attackFrame >= 10) {
                    this.isAttacking = false;
                    this.attackFrame = 0;
                }
            } else if (this.isJumping) {
                const jumpTextures = this.lastLookedDirection === 'right' ? 
                    this.jumpTexturesRight : 
                    this.jumpTexturesLeft;
                this.sprite.material.map = jumpTextures[this.currentFrame];
                this.currentFrame = (this.currentFrame + 1) % 10;
            } else if (this.movement.left || this.movement.right) {
                // Choose between run and walk animations based on shift key
                const movementTextures = this.isShiftPressed ?
                    (this.lastLookedDirection === 'right' ? this.runTexturesRight : this.runTexturesLeft) :
                    (this.lastLookedDirection === 'right' ? this.walkTexturesRight : this.walkTexturesLeft);
                
                this.sprite.material.map = movementTextures[this.currentFrame];
                this.currentFrame = (this.currentFrame + 1) % 10;
            } else {
                const idleTextures = this.lastLookedDirection === 'right' ? 
                    this.idleTexturesRight : 
                    this.idleTexturesLeft;
                this.sprite.material.map = idleTextures[this.currentFrame];
                this.currentFrame = (this.currentFrame + 1) % 10;
            }
        }
    }

    jump() {
        if (this.isGrounded) {
            this.velocity.y = 10;
            this.isGrounded = false;
            this.isJumping = true;
            this.currentFrame = 0;
            this.frameTime = 0;
        }
    }

    handleAttack(event) {
        if (this.isAttacking) return;
        
        const playerScreenPos = this.getScreenPosition();
        this.attackDirection = event.clientX < playerScreenPos.x ? 'left' : 'right';
        
        // Start attack
        this.isAttacking = true;
        this.attackFrame = 0;
        this.lastLookedDirection = this.attackDirection;
        
        // Log the attack type for debugging
        console.log(`Performing ${this.isOnAir ? 'jump attack' : 'ground attack'}`);
    }

    getScreenPosition() {
        // Use the stored camera reference
        const vector = new THREE.Vector3();
        vector.setFromMatrixPosition(this.sprite.matrixWorld);
        vector.project(this.camera);

        return {
            x: (vector.x + 1) * window.innerWidth / 2,
            y: (-vector.y + 1) * window.innerHeight / 2
        };
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.deathFrame = 0;
        this.deathAnimationComplete = false;
        this.velocity.set(0, 0, 0);  // Stop all movement
    }
} 