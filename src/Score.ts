/**
 * Score class to manage player scores in a game.
 */
class Score {
    private currentScore: number;
    private topScores: { score: number; timestamp: string }[];

    constructor() {
        this.currentScore = 0;
        this.topScores = [];
    }
    /**
     * Increase the score when a robot is destroyed.
     * @param {number} distance - The distance between the player and the robot.
     */
    playerHitRobot(distance: number): void {
        let bonus = Math.floor(1000 / distance);
        this.currentScore += 100 + bonus;
    }

    /**
     * Decrease the score when the player is hit.
     */
    playerHit(): void {
        this.currentScore -= 50;
    }

    /**
     * Decrease the score when the player shoots.
     */
    playerShoots(): void {
        this.currentScore -= 2;
    }

    /**
     * Decrease the score when the shield is broken.
     */
    shieldBroken(): void {
        this.currentScore -= 25;
    }

    /**
     * Get the current score.
     * @returns {number} - The current score.
     */
    getCurrentScore(): number {
        return this.currentScore;
    }

    /**
     * Load top scores from the localStorage for the given level.
     * @param {number} levelName - The level number.
     */
    async loadTopScores(levelName: number): Promise<void> {
        console.log('loadTopScores', levelName);
        const topScoresKey = `topScores_${levelName}`;
        try {
            const data = localStorage.getItem(topScoresKey);
            if (data) {
                this.topScores = JSON.parse(data);
            }
        } catch (error) {
            console.error('Error loading top scores:', error);
        }
    }

    /**
     * Save the current score to the localStorage if it's in the top 100 for the given level.
     * @param {number} level - The level number.
     */
    async saveTopScore(level: number): Promise<void> {
        console.log('saveTopScore', level);
        const topScoresKey = `topScores_${level}`;

        try {
            // Load the current top scores for the level
            await this.loadTopScores(level);

            // Check if the current score is in the top 100
            if (this.topScores.length < 100 || this.currentScore > this.topScores[99].score) {
                const newEntry = { score: this.currentScore, timestamp: new Date().toISOString() };

                // Insert the new score and sort the array
                this.topScores.push(newEntry);
                this.topScores.sort((a, b) => b.score - a.score);

                // Truncate to the top 100 scores
                this.topScores = this.topScores.slice(0, 100);

                // Save the updated top scores for the level
                localStorage.setItem(topScoresKey, JSON.stringify(this.topScores));
            }
        } catch (error) {
            console.error('Error saving top score:', error);
        }
    }

    /**
     * Get the rank of the current score.
     * @returns {number} - The rank of the current score.
     */
    public getRank(): number {
        const currentScore = this.getCurrentScore();
        return this.topScores.findIndex((score) => score.score < currentScore) + 1;
    }

    /**
     * Get the top 10 scores.
     * @returns {Array} - The top scores.
     */
    public getTopScores(top: number): { score: number; timestamp: string }[] {
        return this.topScores.slice(0, top);
    }

    /**
     * Reset the current score.
     */
    public reset(): void {
        this.currentScore = 0;
    }
}

const score = new Score();
export default score;
