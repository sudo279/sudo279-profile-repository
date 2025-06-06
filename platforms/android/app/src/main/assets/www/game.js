// Sound Management
class SoundManager {
    constructor() {
        this.sounds = {
            diceRoll: document.getElementById('diceRoll'),
            tokenMove: document.getElementById('tokenMove'),
            victory: document.getElementById('victory'),
            background: document.getElementById('background')
        };
        this.isMuted = false;
        this.initializeSounds();
    }

    initializeSounds() {
        Object.values(this.sounds).forEach(sound => {
            if (sound) {
                sound.volume = sound.id === 'background' ? 0.3 : 0.7;
            }
        });
    }

    playSound(soundName) {
        if (!this.isMuted && this.sounds[soundName]) {
            this.sounds[soundName].currentTime = 0;
            this.sounds[soundName].play().catch(e => console.log('Audio play failed:', e));
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.sounds.background.pause();
        } else {
            this.sounds.background.play().catch(e => console.log('Audio play failed:', e));
        }
        return this.isMuted;
    }
}

// Ad Management
class AdManager {
    constructor() {
        this.moveCount = 0;
        this.interstitialFrequency = 3;
        this.initializeAds();
    }

    initializeAds() {
        // Initialize ad containers
        this.setupBannerAd();
    }

    setupBannerAd() {
        const bannerContainer = document.getElementById('admob-banner');
        if (bannerContainer) {
            bannerContainer.innerHTML = '<div class="ad-placeholder">Advertisement</div>';
        }
    }

    showInterstitial() {
        this.moveCount++;
        if (this.moveCount % this.interstitialFrequency === 0) {
            const interstitialContainer = document.getElementById('interstitial-container');
            if (interstitialContainer) {
                interstitialContainer.classList.remove('hidden');
                setTimeout(() => {
                    interstitialContainer.classList.add('hidden');
                }, 2000);
            }
        }
    }
}

// Game Logic
class LudoGame {
    constructor() {
        this.canvas = document.getElementById('gameBoard');
        this.ctx = this.canvas.getContext('2d');
        this.boardSize = 600;
        this.cellSize = this.boardSize / 15;
        this.diceValue = 1;
        this.isRolling = false;
        this.gameState = 'waiting'; // waiting, rolling, moving
        
        // Initialize sound manager with error handling
        this.soundManager = {
            sounds: {},
            isMuted: false,
            initializeSounds: () => {
                const soundFiles = {
                    diceRoll: { id: 'diceRoll', volume: 0.7 },
                    tokenMove: { id: 'tokenMove', volume: 0.7 },
                    victory: { id: 'victory', volume: 0.7 }
                };
                
                Object.entries(soundFiles).forEach(([key, config]) => {
                    const element = document.getElementById(config.id);
                    if (element) {
                        element.volume = config.volume;
                        this.soundManager.sounds[key] = element;
                    }
                });
            },
            playSound: (soundName) => {
                const sound = this.soundManager.sounds[soundName];
                if (sound && !this.soundManager.isMuted) {
                    sound.currentTime = 0;
                    sound.play().catch(e => console.log('Audio play failed:', e));
                }
            },
            toggleMute: () => {
                this.soundManager.isMuted = !this.soundManager.isMuted;
                return this.soundManager.isMuted;
            }
        };
        
        // Initialize ad manager
        this.adManager = new AdManager();
        
        // Define player configurations
        const playerConfigs = [
            { id: 0, color: '#FF0000', name: 'Red', startCorner: [0, 0], pathStart: [6, 13] },
            { id: 1, color: '#00FF00', name: 'Green', startCorner: [9, 0], pathStart: [1, 6] },
            { id: 2, color: '#0000FF', name: 'Blue', startCorner: [9, 9], pathStart: [8, 1] },
            { id: 3, color: '#FFFF00', name: 'Yellow', startCorner: [0, 9], pathStart: [13, 8] }
        ];

        // Initialize players
        this.players = playerConfigs.map(config => ({
            ...config,
            tokens: [],
            active: true,
            score: 0
        }));
        
        this.currentPlayer = 0;
        
        // Initialize game
        this.initializeGame();
        this.setupEventListeners();
        this.updateTurnIndicator();
        
        // Initialize sounds
        this.soundManager.initializeSounds();
        
        // Start animation loop
        requestAnimationFrame(() => this.gameLoop());
    }

    gameLoop() {
        // Update token positions for animations
        this.updateTokenPositions();
        
        // Render the game
        this.render();
        
        // Continue the game loop
        requestAnimationFrame(() => this.gameLoop());
    }

    updateTurnIndicator() {
        const rollButton = document.getElementById('rollDice');
        const currentPlayer = this.players[this.currentPlayer];
        
        // Update button color and text
        rollButton.style.backgroundColor = currentPlayer.color;
        rollButton.style.color = this.isColorLight(currentPlayer.color) ? '#000000' : '#FFFFFF';
        rollButton.textContent = this.isRolling ? 'Rolling...' : `${currentPlayer.name}'s Turn - Roll Dice`;
        
        // Add a glow effect to indicate active player
        rollButton.style.boxShadow = `0 0 15px ${currentPlayer.color}`;
    }

    isColorLight(color) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return brightness > 155;
    }

    initializeGame() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Define player configurations with home positions and paths
        const playerConfigs = [
            {
                color: '#FF0000',
                name: 'Red',
                startCorner: [0, 0],
                homePositions: [[1,1], [4,1], [1,4], [4,4]],
                pathStart: [6, 13],
                pathColor: '#FFE6E6'
            },
            {
                color: '#00FF00',
                name: 'Green',
                startCorner: [9, 0],
                homePositions: [[10,1], [13,1], [10,4], [13,4]],
                pathStart: [1, 6],
                pathColor: '#E6FFE6'
            },
            {
                color: '#0000FF',
                name: 'Blue',
                startCorner: [9, 9],
                homePositions: [[10,10], [13,10], [10,13], [13,13]],
                pathStart: [8, 1],
                pathColor: '#E6E6FF'
            },
            {
                color: '#FFFF00',
                name: 'Yellow',
                startCorner: [0, 9],
                homePositions: [[1,10], [4,10], [1,13], [4,13]],
                pathStart: [13, 8],
                pathColor: '#FFFFF0'
            }
        ];

        // Initialize players with their configurations
        this.players = playerConfigs.map((config, index) => ({
            id: index,
            ...config,
            active: true,
            score: 0,
            tokens: this.createTokensForPlayer(config.homePositions)
        }));

        // Start with Red player
        this.currentPlayer = 0;
        this.gameState = 'waiting';
        
        // Initial render
        this.render();
        
        // Update turn indicator
        this.updateTurnIndicator();
        
        // Request first animation frame
        requestAnimationFrame(() => this.gameLoop());
    }

    createTokensForPlayer(homePositions) {
        return homePositions.map((pos, index) => ({
            id: index,
            position: 'home',
            steps: 0,
            x: pos[0],
            y: pos[1],
            isHighlighted: false,
            isMoving: false,
            moveStartTime: 0,
            moveEndTime: 0,
            startPos: { x: pos[0], y: pos[1] },
            targetPos: { x: pos[0], y: pos[1] },
            animationProgress: 0
        }));
    }

    gameLoop(timestamp) {
        // Update animations
        this.players.forEach(player => {
            player.tokens.forEach(token => {
                if (token.isMoving) {
                    const progress = Math.min(1, (timestamp - token.moveStartTime) / 500);
                    token.animationProgress = progress;
                    
                    if (progress >= 1) {
                        token.isMoving = false;
                        token.x = token.targetPos.x;
                        token.y = token.targetPos.y;
                        this.checkWinCondition();
                    } else {
                        token.x = token.startPos.x + (token.targetPos.x - token.startPos.x) * progress;
                        token.y = token.startPos.y + (token.targetPos.y - token.startPos.y) * progress;
                    }
                }
            });
        });

        // Render the game
        this.render();

        // Continue animation loop
        requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    updateTokenPositions() {
        this.players.forEach(player => {
            player.tokens.forEach(token => {
                if (token.isMoving) {
                    // Calculate animation progress
                    const now = Date.now();
                    const progress = Math.min(1, (now - token.moveStartTime) / 500); // 500ms animation

                    if (progress < 1) {
                        // Update position based on animation progress
                        token.x = token.startPos.x + (token.targetPos.x - token.startPos.x) * progress;
                        token.y = token.startPos.y + (token.targetPos.y - token.startPos.y) * progress;
                    } else {
                        // Animation complete
                        token.x = token.targetPos.x;
                        token.y = token.targetPos.y;
                        token.isMoving = false;
                    }
                }
            });
        });
    }

    render() {
        // Clear canvas with a slight off-white background
        this.ctx.fillStyle = '#FAFAFA';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw board elements in order
        this.drawGrid();
        this.drawPaths();
        this.drawHomeAreas();
        this.drawCenterSquare();
        
        // Draw player indicators
        this.drawPlayerIndicators();

        // First pass: Draw all token shadows
        this.players.forEach(player => {
            player.tokens.forEach(token => {
                if (token.position !== 'finished') {
                    const shadowOffset = 2;
                    this.drawToken(
                        token.x + shadowOffset / this.cellSize,
                        token.y + shadowOffset / this.cellSize,
                        'rgba(0, 0, 0, 0.2)',
                        false,
                        true
                    );
                }
            });
        });

        // Second pass: Draw inactive player tokens
        this.players.forEach(player => {
            if (!player.active) {
                player.tokens.forEach(token => {
                    if (token.position !== 'finished') {
                        this.drawToken(token.x, token.y, player.color, false, false, 0.5);
                    }
                });
            }
        });

        // Third pass: Draw active player tokens
        this.players.forEach(player => {
            if (player.active) {
                player.tokens.forEach(token => {
                    if (token.position !== 'finished') {
                        // Add pulsing effect for current player's tokens
                        const isCurrentPlayer = player.id === this.currentPlayer;
                        const pulseScale = isCurrentPlayer ? 
                            1 + Math.sin(Date.now() / 500) * 0.05 : 1;
                        
                        this.drawToken(
                            token.x,
                            token.y,
                            player.color,
                            token.isHighlighted,
                            false,
                            1,
                            pulseScale
                        );
                    }
                });
            }
        });

        // Draw dice last so it's always on top
        this.drawDice();

        // Draw turn indicator
        this.drawTurnIndicator();
    }

    drawTurnIndicator() {
        const currentPlayer = this.players[this.currentPlayer];
        const padding = 10;
        const height = 40;
        
        // Draw background
        this.ctx.fillStyle = currentPlayer.color;
        this.ctx.globalAlpha = 0.9;
        this.roundRect(padding, this.canvas.height - height - padding, 200, height, 10);
        this.ctx.fill();
        
        // Draw text
        this.ctx.globalAlpha = 1;
        this.ctx.fillStyle = this.isColorLight(currentPlayer.color) ? '#000000' : '#FFFFFF';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(
            `${currentPlayer.name}'s Turn`,
            padding + 10,
            this.canvas.height - height/2 - padding
        );
    }

    drawPlayerIndicators() {
        const indicatorSize = this.cellSize * 1.5;
        const padding = this.cellSize * 0.5;
        
        this.players.forEach((player, index) => {
            if (!player.active) return;

            // Calculate indicator position with more spacing
            let x, y;
            switch(index) {
                case 0: // Red (top-left)
                    x = padding;
                    y = padding;
                    break;
                case 1: // Green (top-right)
                    x = this.canvas.width - indicatorSize - padding;
                    y = padding;
                    break;
                case 2: // Blue (bottom-right)
                    x = this.canvas.width - indicatorSize - padding;
                    y = this.canvas.height - indicatorSize - padding;
                    break;
                case 3: // Yellow (bottom-left)
                    x = padding;
                    y = this.canvas.height - indicatorSize - padding;
                    break;
            }

            // Draw outer glow for current player
            if (index === this.currentPlayer) {
                const glowSize = 10;
                const gradient = this.ctx.createRadialGradient(
                    x + indicatorSize/2, 
                    y + indicatorSize/2, 
                    indicatorSize/2,
                    x + indicatorSize/2, 
                    y + indicatorSize/2, 
                    indicatorSize/2 + glowSize
                );
                gradient.addColorStop(0, player.color);
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(
                    x - glowSize, 
                    y - glowSize, 
                    indicatorSize + glowSize*2, 
                    indicatorSize + glowSize*2
                );
            }

            // Draw indicator shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.roundRect(x + 3, y + 3, indicatorSize, indicatorSize, 12);
            this.ctx.fill();

            // Draw player indicator background with gradient
            const gradient = this.ctx.createLinearGradient(x, y, x, y + indicatorSize);
            gradient.addColorStop(0, this.lightenColor(player.color, 10));
            gradient.addColorStop(1, this.darkenColor(player.color, 10));
            
            this.ctx.fillStyle = gradient;
            this.ctx.globalAlpha = index === this.currentPlayer ? 1 : 0.7;
            this.roundRect(x, y, indicatorSize, indicatorSize, 12);
            this.ctx.fill();

            // Add metallic border
            const borderGradient = this.ctx.createLinearGradient(x, y, x + indicatorSize, y + indicatorSize);
            borderGradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
            borderGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
            borderGradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
            
            this.ctx.strokeStyle = borderGradient;
            this.ctx.lineWidth = 2;
            this.roundRect(x, y, indicatorSize, indicatorSize, 12);
            this.ctx.stroke();

            // Draw player name
            this.ctx.globalAlpha = 1;
            const textColor = this.isColorLight(player.color) ? '#000000' : '#FFFFFF';
            
            // Draw text shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.font = `bold ${indicatorSize * 0.35}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(
                player.name,
                x + indicatorSize / 2 + 1,
                y + indicatorSize / 2 + 1
            );
            
            // Draw actual text with subtle gradient
            const textGradient = this.ctx.createLinearGradient(
                x, y + indicatorSize/2 - 10,
                x, y + indicatorSize/2 + 10
            );
            textGradient.addColorStop(0, textColor);
            textGradient.addColorStop(1, this.isColorLight(player.color) ? '#333333' : '#CCCCCC');
            
            this.ctx.fillStyle = textGradient;
            this.ctx.fillText(
                player.name,
                x + indicatorSize / 2,
                y + indicatorSize / 2
            );

            // Add highlight effect
            if (index === this.currentPlayer) {
                const highlightSize = Math.sin(Date.now() / 500) * 3 + 3;
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                this.ctx.lineWidth = highlightSize;
                this.roundRect(
                    x - highlightSize/2, 
                    y - highlightSize/2, 
                    indicatorSize + highlightSize, 
                    indicatorSize + highlightSize, 
                    12
                );
                this.ctx.stroke();
            }
        });
        
        this.ctx.globalAlpha = 1;
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const size = Math.min(container.clientWidth, container.clientHeight);
        this.canvas.width = size;
        this.canvas.height = size;
        this.cellSize = size / 15;
        this.render();
    }

    setupEventListeners() {
        document.getElementById('rollDice').addEventListener('click', () => {
            if (!this.isRolling) {
                this.rollDice();
            }
        });

        document.getElementById('toggleSound').addEventListener('click', () => {
            const isMuted = this.soundManager.toggleMute();
            document.getElementById('toggleSound').textContent = 
                isMuted ? '🔇 Sound Off' : '🔊 Sound On';
        });
    }

    rollDice() {
        if (this.isRolling || this.gameState !== 'waiting') return;

        this.gameState = 'rolling';
        this.isRolling = true;
        this.soundManager.playSound('diceRoll');
        
        // Store the initial rotation
        this.diceRotation = 0;
        
        // Update UI
        this.updateTurnIndicator();
        
        let rolls = 0;
        const maxRolls = 20;
        const rollInterval = setInterval(() => {
            // Update rotation
            this.diceRotation += 30;
            
            // Generate random dice value
            this.diceValue = Math.floor(Math.random() * 6) + 1;
            
            // Request animation frame for smooth rendering
            requestAnimationFrame(() => this.render());
            
            rolls++;
            
            if (rolls >= maxRolls) {
                clearInterval(rollInterval);
                this.isRolling = false;
                this.diceRotation = 0;
                this.gameState = 'moving';
                
                // Check for possible moves
                const hasMoves = this.checkPossibleMoves();
                
                // If no moves are possible, wait and move to next player
                if (!hasMoves) {
                    setTimeout(() => {
                        this.soundManager.playSound('tokenMove');
                        this.nextTurn();
                    }, 1000);
                }
                
                // Show ad occasionally
                if (Math.random() < 0.2) { // 20% chance
                    this.adManager.showInterstitial();
                }
                
                // Final render after rolling stops
                this.updateTurnIndicator();
                requestAnimationFrame(() => this.render());
            }
        }, 50);
    }

    nextTurn() {
        // Move to next player
        this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
        
        // Skip inactive players
        while (!this.players[this.currentPlayer].active) {
            this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
        }
        
        // Reset game state
        this.gameState = 'waiting';
        this.diceValue = 1;
        
        // Update UI
        this.updateTurnIndicator();
        this.render();
    }

    checkWinCondition() {
        const currentPlayer = this.players[this.currentPlayer];
        const allTokensHome = currentPlayer.tokens.every(token => 
            token.steps >= 57 || token.position === 'finished'
        );
        
        if (allTokensHome) {
            // Play victory sound
            this.soundManager.playSound('victory');
            
            // Mark player as inactive
            currentPlayer.active = false;
            
            // Check if game is over
            const activePlayers = this.players.filter(p => p.active).length;
            if (activePlayers <= 1) {
                this.gameState = 'finished';
                alert(`Game Over! ${currentPlayer.name} wins!`);
                return true;
            }
        }
        return false;
    }

    checkPossibleMoves() {
        const currentPlayer = this.players[this.currentPlayer];
        let hasPossibleMoves = false;

        currentPlayer.tokens.forEach(token => {
            if (this.isValidMove(token)) {
                // Highlight valid tokens
                token.isHighlighted = true;
                hasPossibleMoves = true;
            } else {
                token.isHighlighted = false;
            }
        });

        if (!hasPossibleMoves) {
            setTimeout(() => {
                this.nextTurn();
            }, 1000);
        }
    }

    isValidMove(token) {
        if (token.position === 'home' && this.diceValue === 6) {
            return true;
        }
        if (token.position !== 'home') {
            const newPosition = token.steps + this.diceValue;
            return newPosition <= 57; // Total steps to finish
        }
        return false;
    }

    moveToken(token) {
        if (token.position === 'home' && this.diceValue === 6) {
            // Move token out of home
            token.position = 'board';
            token.steps = 0;
            this.animateToken(token, this.getStartPosition(this.currentPlayer));
        } else if (token.position === 'board') {
            // Move token on the board
            token.steps += this.diceValue;
            const newPos = this.calculateTokenPosition(token.steps, this.currentPlayer);
            this.animateToken(token, newPos);
        }
    }

    animateToken(token, targetPos) {
        const startX = token.x;
        const startY = token.y;
        const endX = targetPos.x;
        const endY = targetPos.y;
        
        let progress = 0;
        const animate = () => {
            progress += 0.05;
            
            if (progress >= 1) {
                token.x = endX;
                token.y = endY;
                this.render();
                this.checkWinCondition();
                return;
            }
            
            token.x = startX + (endX - startX) * progress;
            token.y = startY + (endY - startY) * progress;
            
            this.render();
            requestAnimationFrame(animate);
        };
        
        requestAnimationFrame(animate);
    }

    getStartPosition(playerIndex) {
        const startPositions = [
            { x: 6, y: 13 },  // Red start
            { x: 1, y: 6 },   // Green start
            { x: 8, y: 1 },   // Blue start
            { x: 13, y: 8 }   // Yellow start
        ];
        return startPositions[playerIndex];
    }

    calculateTokenPosition(steps, playerIndex) {
        // Define the path coordinates for each player
        const paths = {
            0: [ // Red path
                [6, 13], [6, 12], [6, 11], [6, 10], [6, 9],
                [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
                [0, 7], [0, 6],
                [1, 6], [2, 6], [3, 6], [4, 6], [5, 6],
                [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0],
                [7, 0], [8, 0],
                [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],
                [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6],
                [14, 7], [14, 8],
                [13, 8], [12, 8], [11, 8], [10, 8], [9, 8],
                [8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14],
                [7, 14], [7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8] // Home stretch
            ]
        };

        // Calculate paths for other players by rotating the red path
        paths[1] = paths[0].map(([x, y]) => [y, 14 - x]); // Green (90° rotation)
        paths[2] = paths[0].map(([x, y]) => [14 - x, 14 - y]); // Blue (180° rotation)
        paths[3] = paths[0].map(([x, y]) => [14 - y, x]); // Yellow (270° rotation)

        if (steps >= paths[playerIndex].length) {
            return { x: 7, y: 7 }; // Center position for finished tokens
        }

        const [x, y] = paths[playerIndex][steps];
        return { x, y };
    }

    render() {
        // Clear canvas with a slight off-white background
        this.ctx.fillStyle = '#FAFAFA';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw board elements in order
        this.drawGrid();
        this.drawPaths();
        this.drawHomeAreas();
        this.drawCenterSquare();
        
        // Draw player indicators
        this.drawPlayerIndicators();

        // First pass: Draw all token shadows
        this.players.forEach(player => {
            player.tokens.forEach(token => {
                if (token.position !== 'finished' && token.position !== 'home') {
                    const shadowOffset = 2;
                    this.drawToken(
                        token.x + shadowOffset / this.cellSize,
                        token.y + shadowOffset / this.cellSize,
                        'rgba(0, 0, 0, 0.2)',
                        false,
                        true
                    );
                }
            });
        });

        // Second pass: Draw inactive player tokens
        this.players.forEach(player => {
            if (!player.active) {
                player.tokens.forEach(token => {
                    if (token.position !== 'finished' && token.position !== 'home') {
                        this.drawToken(token.x, token.y, player.color, false, false, 0.5);
                    }
                });
            }
        });

        // Third pass: Draw active player tokens
        this.players.forEach(player => {
            if (player.active) {
                player.tokens.forEach(token => {
                    if (token.position !== 'finished' && token.position !== 'home') {
                        // Add pulsing effect for current player's tokens
                        const isCurrentPlayer = player.id === this.currentPlayer;
                        const pulseScale = isCurrentPlayer ? 
                            1 + Math.sin(Date.now() / 500) * 0.05 : 1;
                        
                        this.drawToken(
                            token.x,
                            token.y,
                            player.color,
                            token.isHighlighted,
                            false,
                            1,
                            pulseScale
                        );
                    }
                });
            }
        });

        // Draw dice last so it's always on top
        this.drawDice();

        // Draw turn indicator
        this.drawTurnIndicator();
    }

    drawPaths() {
        // Define path colors for each player
        const pathColors = {
            red: '#FFE6E6',
            green: '#E6FFE6',
            blue: '#E6E6FF',
            yellow: '#FFFFF0'
        };

        // Draw vertical paths
        this.drawColoredRect(6, 0, 3, 6, pathColors.green);  // Top
        this.drawColoredRect(6, 9, 3, 6, pathColors.blue);   // Bottom

        // Draw horizontal paths
        this.drawColoredRect(0, 6, 6, 3, pathColors.red);    // Left
        this.drawColoredRect(9, 6, 6, 3, pathColors.yellow); // Right

        // Draw finish lines (colored paths to center)
        this.drawColoredRect(7, 6, 2, 3, pathColors.green);  // Green path
        this.drawColoredRect(6, 7, 3, 2, pathColors.red);    // Red path
        this.drawColoredRect(6, 6, 3, 2, pathColors.yellow); // Yellow path
        this.drawColoredRect(6, 6, 2, 3, pathColors.blue);   // Blue path
    }

    drawColoredRect(x, y, width, height, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
            x * this.cellSize,
            y * this.cellSize,
            width * this.cellSize,
            height * this.cellSize
        );
        
        // Draw cell borders
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= width; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo((x + i) * this.cellSize, y * this.cellSize);
            this.ctx.lineTo((x + i) * this.cellSize, (y + height) * this.cellSize);
            this.ctx.stroke();
        }
        for (let i = 0; i <= height; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.cellSize, (y + i) * this.cellSize);
            this.ctx.lineTo((x + width) * this.cellSize, (y + i) * this.cellSize);
            this.ctx.stroke();
        }
    }

    drawCenterSquare() {
        // Draw center square background
        this.ctx.fillStyle = '#F0F0F0';
        this.ctx.fillRect(
            6 * this.cellSize,
            6 * this.cellSize,
            3 * this.cellSize,
            3 * this.cellSize
        );

        // Draw center square border
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(
            6 * this.cellSize,
            6 * this.cellSize,
            3 * this.cellSize,
            3 * this.cellSize
        );

        // Draw diagonal lines
        this.ctx.beginPath();
        this.ctx.moveTo(6 * this.cellSize, 6 * this.cellSize);
        this.ctx.lineTo(9 * this.cellSize, 9 * this.cellSize);
        this.ctx.moveTo(9 * this.cellSize, 6 * this.cellSize);
        this.ctx.lineTo(6 * this.cellSize, 9 * this.cellSize);
        this.ctx.stroke();
    }

    drawGrid() {
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1;

        // Vertical lines
        for (let i = 0; i <= 15; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.cellSize, 0);
            this.ctx.lineTo(i * this.cellSize, this.canvas.height);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let i = 0; i <= 15; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.cellSize);
            this.ctx.lineTo(this.canvas.width, i * this.cellSize);
            this.ctx.stroke();
        }
    }

    drawHomeAreas() {
        const homeAreas = [
            { 
                color: '#FF0000', 
                bg: '#FFE6E6', 
                x: 0, 
                y: 0,
                tokens: [[1,1], [4,1], [1,4], [4,4]]
            },
            { 
                color: '#00FF00', 
                bg: '#E6FFE6', 
                x: 9, 
                y: 0,
                tokens: [[10,1], [13,1], [10,4], [13,4]]
            },
            { 
                color: '#0000FF', 
                bg: '#E6E6FF', 
                x: 9, 
                y: 9,
                tokens: [[10,10], [13,10], [10,13], [13,13]]
            },
            { 
                color: '#FFFF00', 
                bg: '#FFFFF0', 
                x: 0, 
                y: 9,
                tokens: [[1,10], [4,10], [1,13], [4,13]]
            }
        ];

        homeAreas.forEach(area => {
            // Draw background with gradient
            const gradient = this.ctx.createLinearGradient(
                area.x * this.cellSize,
                area.y * this.cellSize,
                (area.x + 6) * this.cellSize,
                (area.y + 6) * this.cellSize
            );
            gradient.addColorStop(0, area.bg);
            gradient.addColorStop(1, this.lightenColor(area.bg, 10));

            this.ctx.fillStyle = gradient;
            this.ctx.strokeStyle = area.color;
            this.ctx.lineWidth = 2;

            // Draw area with rounded corners
            this.ctx.beginPath();
            this.roundRect(
                area.x * this.cellSize,
                area.y * this.cellSize,
                this.cellSize * 6,
                this.cellSize * 6,
                10
            );
            this.ctx.fill();
            this.ctx.stroke();

            // Add inner border for depth effect
            this.ctx.strokeStyle = this.lightenColor(area.color, 30);
            this.ctx.lineWidth = 1;
            this.roundRect(
                area.x * this.cellSize + 3,
                area.y * this.cellSize + 3,
                this.cellSize * 6 - 6,
                this.cellSize * 6 - 6,
                8
            );
            this.ctx.stroke();

            // Add subtle pattern
            this.ctx.fillStyle = this.lightenColor(area.color, 40);
            this.ctx.globalAlpha = 0.1;
            for (let i = 0; i < 6; i++) {
                for (let j = 0; j < 6; j++) {
                    if ((i + j) % 2 === 0) {
                        this.ctx.fillRect(
                            (area.x + i) * this.cellSize,
                            (area.y + j) * this.cellSize,
                            this.cellSize,
                            this.cellSize
                        );
                    }
                }
            }
            this.ctx.globalAlpha = 1;

            // Draw tokens in home positions
            area.tokens.forEach(([tokenX, tokenY]) => {
                // Draw token shadow first
                this.drawToken(
                    tokenX + 0.05,
                    tokenY + 0.05,
                    'rgba(0, 0, 0, 0.2)',
                    false,
                    true
                );
                // Then draw the actual token
                this.drawToken(tokenX, tokenY, area.color);
            });
        });
    }

    drawToken(x, y, color, isHighlighted = false, isShadow = false, alpha = 1, scale = 1) {
        const centerX = (x + 0.5) * this.cellSize;
        const centerY = (y + 0.5) * this.cellSize;
        const baseRadius = this.cellSize * 0.35;
        const radius = baseRadius * scale;

        // Save current context state
        this.ctx.save();
        this.ctx.globalAlpha = alpha;

        if (isShadow) {
            // Draw only shadow for shadow pass
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.fill();
            this.ctx.restore();
            return;
        }

        // Draw highlight effect for valid moves
        if (isHighlighted) {
            // Outer glow
            const glowGradient = this.ctx.createRadialGradient(
                centerX, centerY, radius,
                centerX, centerY, radius * 1.5
            );
            glowGradient.addColorStop(0, 'rgba(255, 255, 0, 0.3)');
            glowGradient.addColorStop(1, 'rgba(255, 255, 0, 0)');

            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
            this.ctx.fillStyle = glowGradient;
            this.ctx.fill();

            // Pulsing inner highlight
            const pulseSize = 1.1 + Math.sin(Date.now() / 500) * 0.1;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius * pulseSize, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
            this.ctx.fill();
        }

        // Draw token base with 3D effect
        const gradient = this.ctx.createRadialGradient(
            centerX - radius * 0.3,
            centerY - radius * 0.3,
            radius * 0.1,
            centerX,
            centerY,
            radius
        );
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(0.4, this.lightenColor(color, 20));
        gradient.addColorStop(0.6, color);
        gradient.addColorStop(1, this.darkenColor(color, 30));

        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        // Draw token border with metallic effect
        const borderGradient = this.ctx.createLinearGradient(
            centerX - radius,
            centerY - radius,
            centerX + radius,
            centerY + radius
        );
        borderGradient.addColorStop(0, this.lightenColor(color, 10));
        borderGradient.addColorStop(0.5, this.darkenColor(color, 20));
        borderGradient.addColorStop(1, this.darkenColor(color, 40));

        this.ctx.strokeStyle = borderGradient;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Draw specular highlight
        const highlightGradient = this.ctx.createRadialGradient(
            centerX - radius * 0.3,
            centerY - radius * 0.3,
            0,
            centerX - radius * 0.3,
            centerY - radius * 0.3,
            radius * 0.4
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        this.ctx.beginPath();
        this.ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.4, 0, Math.PI * 2);
        this.ctx.fillStyle = highlightGradient;
        this.ctx.fill();

        // Restore context state
        this.ctx.restore();
    }

    // Helper function to lighten a color
    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R : 255) * 0x10000 +
            (G < 255 ? G : 255) * 0x100 +
            (B < 255 ? B : 255))
            .toString(16)
            .slice(1);
    }

    // Helper function to darken a color
    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return '#' + (0x1000000 + (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
            (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
            (B < 255 ? (B < 1 ? 0 : B) : 255))
            .toString(16)
            .slice(1);
    }

    drawDice() {
        const diceSize = this.cellSize * 2;
        const x = this.canvas.width - diceSize - 20;
        const y = this.canvas.height - diceSize - 20;
        const dotSize = diceSize * 0.15;
        const cornerRadius = diceSize * 0.2;

        // Save context for rotation
        this.ctx.save();
        if (this.isRolling) {
            this.ctx.translate(x + diceSize/2, y + diceSize/2);
            this.ctx.rotate((Date.now() % 360) * Math.PI / 180);
            this.ctx.translate(-(x + diceSize/2), -(y + diceSize/2));
        }

        // Draw outer glow
        const glowSize = 15;
        const glowGradient = this.ctx.createRadialGradient(
            x + diceSize/2, y + diceSize/2, diceSize/2,
            x + diceSize/2, y + diceSize/2, diceSize/2 + glowSize
        );
        glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = glowGradient;
        this.ctx.fillRect(
            x - glowSize, y - glowSize,
            diceSize + glowSize*2, diceSize + glowSize*2
        );

        // Draw dice shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.roundRect(x + 5, y + 5, diceSize, diceSize, cornerRadius);
        this.ctx.fill();

        // Draw dice background with metallic gradient
        const bgGradient = this.ctx.createLinearGradient(x, y, x + diceSize, y + diceSize);
        bgGradient.addColorStop(0, '#FFFFFF');
        bgGradient.addColorStop(0.5, '#F0F0F0');
        bgGradient.addColorStop(1, '#E0E0E0');
        
        this.ctx.fillStyle = bgGradient;
        this.roundRect(x, y, diceSize, diceSize, cornerRadius);
        this.ctx.fill();

        // Add metallic border
        const borderGradient = this.ctx.createLinearGradient(x, y, x + diceSize, y);
        borderGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        borderGradient.addColorStop(0.5, 'rgba(192, 192, 192, 0.8)');
        borderGradient.addColorStop(1, 'rgba(128, 128, 128, 0.8)');
        
        this.ctx.strokeStyle = borderGradient;
        this.ctx.lineWidth = 3;
        this.roundRect(x, y, diceSize, diceSize, cornerRadius);
        this.ctx.stroke();

        // Draw dots based on dice value
        const dotPositions = {
            1: [[0.5, 0.5]],
            2: [[0.25, 0.25], [0.75, 0.75]],
            3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
            4: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]],
            5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]],
            6: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.5], [0.75, 0.5], [0.25, 0.75], [0.75, 0.75]]
        };

        // Draw dots with enhanced 3D effect
        dotPositions[this.diceValue].forEach(([px, py]) => {
            const dotX = x + px * diceSize;
            const dotY = y + py * diceSize;

            // Draw dot shadow
            this.ctx.beginPath();
            this.ctx.arc(dotX + 2, dotY + 2, dotSize, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fill();

            // Draw dot base
            this.ctx.beginPath();
            this.ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2);
            const dotGradient = this.ctx.createRadialGradient(
                dotX - dotSize * 0.3, dotY - dotSize * 0.3, 0,
                dotX, dotY, dotSize
            );
            dotGradient.addColorStop(0, '#404040');
            dotGradient.addColorStop(1, '#000000');
            this.ctx.fillStyle = dotGradient;
            this.ctx.fill();

            // Add dot highlight
            this.ctx.beginPath();
            this.ctx.arc(
                dotX - dotSize * 0.2,
                dotY - dotSize * 0.2,
                dotSize * 0.4,
                0,
                Math.PI * 2
            );
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.fill();
        });

        // Add shine effect
        const shineGradient = this.ctx.createLinearGradient(
            x, y,
            x + diceSize, y + diceSize
        );
        shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
        shineGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
        shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0.2)');
        
        this.ctx.fillStyle = shineGradient;
        this.roundRect(x, y, diceSize, diceSize, cornerRadius);
        this.ctx.fill();

        // Restore context
        this.ctx.restore();

        // Add pulsing effect when rolling
        if (this.isRolling) {
            const pulseSize = Math.sin(Date.now() / 100) * 5;
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 2 + pulseSize;
            this.roundRect(
                x - pulseSize,
                y - pulseSize,
                diceSize + pulseSize * 2,
                diceSize + pulseSize * 2,
                cornerRadius
            );
            this.ctx.stroke();
        }
    }

    // Helper method for drawing rounded rectangles
    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.arcTo(x + width, y, x + width, y + height, radius);
        this.ctx.arcTo(x + width, y + height, x, y + height, radius);
        this.ctx.arcTo(x, y + height, x, y, radius);
        this.ctx.arcTo(x, y, x + width, y, radius);
        this.ctx.closePath();
    }
}

// Initialize game when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new LudoGame();
});
