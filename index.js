import Game from "./lib/game.js";
import Twitter from "./lib/twitter.js";

const twitter = new Twitter();

let game = null;

try {
  game = await Game.readFile("data/save.json");
} catch (e) {
  let game = new Game(8, 13);
}

console.log(status);

try {
  await game.update();

  const status = game.draw();
  
  await twitter.tweet(status);
  
  await game.writeFile("data/save.json");
} catch (e) {
  console.log(e);
}
