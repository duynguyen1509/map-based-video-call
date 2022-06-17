var game = new Phaser.Game(
  20 * 16,
  20 * 16,
  Phaser.AUTO,
  document.getElementById("game")
);
game.state.add("Game", Game);
game.state.start("Game");
