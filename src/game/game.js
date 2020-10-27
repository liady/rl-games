import engine from "./projectData";

// Globals
let inp = null; // input
let scr = null; // screen
let aud = null; // audio

let settings;

let player;

export const morty = {
  x: 159,
  y: 50,
  speed: 0.8,
  isWalking: false,
  flip: 0,
  framesSinceWalkStart: 0,
  direction: 0,
};

let numberOfGrabbedTargets = 0;

const targets = [];

let randomColor = 1;

// initialization
engine.onInit = () => {
  inp = engine.input;
  scr = engine.screen;
  window.scr = scr;
  window.inp = inp;
  aud = engine.audio;

  updateColors();
};

// update loop
engine.onUpdate = () => {
  scr.clear(1);

  scr.drawMap(
    0, // originX on map
    0, // originY on map
    -1, // width
    -1, // height
    0, // screenX
    0, // screenY
    settings.space ? 1 : 0 // tilemap index
  );

  if (settings.targets) {
    drawTargets();
  }

  updateMainPlayer();

  if (settings.morty) {
    updatePlayerMorty();
  }
  drawText();
};

function drawText() {
  let textMainColor = 2;
  if (numberOfGrabbedTargets >= 3) {
    textMainColor = randomColor;
  }

  let textPositionOffset = 0;
  if (numberOfGrabbedTargets >= 5) {
    textPositionOffset = Math.sin(engine.realTimeSinceGameStart * 10) * 8;
  }

  scr.drawText(
    settings.space ? "Virtual React Summit 2020!" : "React Summit 2020!",
    settings.space ? 25 : 50,
    90 + Math.floor(textPositionOffset),
    textMainColor,
    1,
    0
  );

  settings.targets &&
    scr.drawText("" + numberOfGrabbedTargets, 10, 115, 2, 1, 0);
}

function drawTargets() {
  targets.forEach((target) => {
    if (!target.wasGrabbed) {
      scr.drawTile(
        target.index || 61,
        target.x - 8, // center on the position
        target.y - 8, // center on the position
        0
      );
    }
  });
}

function moveMorty() {
  requestAnimationFrame(() => {
    // move morty randomly
    morty.direction = ["left", "right", "up", "down"][
      Math.floor(Math.random() * 4)
    ];
    setTimeout(async () => {
      morty.direction = null;
      requestAnimationFrame(moveMorty);
    }, Math.random() * 150 + 200);
  });
}

function updatePlayerMorty() {
  drawEntity(morty, {
    startingFrameGID: 12,
    directions: {
      [morty.direction]: true,
    },
  });
}

function updateMainPlayer() {
  const { startedWalking, stoppedWalking } = drawEntity(player, {
    startingFrameGID: settings.space ? 9 : 1,
    directions: {
      left: inp.left.pressed,
      right: inp.right.pressed,
      up: inp.up.pressed,
      down: inp.down.pressed,
    },
  });

  // play or stop audio
  if (!settings.ai) {
    playAudio({ startedWalking, stoppedWalking });
  }

  checkCollisions();
}

function drawEntity(entity, { startingFrameGID, directions } = {}) {
  let newX = entity.x;
  let newY = entity.y;
  let isWalking = false;

  // move according to input (keyboard/ai)
  if (directions.left) {
    newX -= entity.speed;
    isWalking = true;
    entity.flip = 1;
  } else if (directions.right) {
    newX += entity.speed;
    isWalking = true;
    entity.flip = 0;
  }
  if (directions.down) {
    newY -= entity.speed;
    isWalking = true;
  } else if (directions.up) {
    newY += entity.speed;
    isWalking = true;
  }

  if (isWalking) {
    entity.framesSinceWalkStart += 1;
  }

  const startedWalking = isWalking && !entity.isWalking;
  const stoppedWalking = !isWalking && entity.isWalking;

  if (startedWalking) {
    player.framesSinceWalkStart = 0;
  }

  entity.isWalking = isWalking;

  // make sure we are not colliding with the fence
  if (
    newX >= 16 &&
    newX < scr.width - 16 &&
    newY >= 24 &&
    newY < scr.height - 16
  ) {
    entity.x = newX;
    entity.y = newY;
  }

  // draw the entity
  let frameGID = startingFrameGID;
  if (entity.isWalking) {
    if (entity.framesSinceWalkStart % 16 < 8) {
      frameGID = frameGID + 1;
    } else {
      frameGID = frameGID + 2;
    }
  }

  scr.drawTile(
    frameGID,
    Math.floor(entity.x) - 8, // center the tile on the position
    Math.floor(entity.y) - 8, // center the tile on the position
    entity.flip
  );

  return { startedWalking, stoppedWalking };
}

function playAudio({ startedWalking, stoppedWalking }) {
  if (startedWalking) {
    let note = window.bitmelo.Notes.C4;
    if (numberOfGrabbedTargets > 1) {
      note = window.bitmelo.Notes.C2;
    } else if (numberOfGrabbedTargets > 0) {
      note = window.bitmelo.Notes.C3;
    }
    aud.playInfiniteSound(0, note, 0.5, 2);
  } else if (stoppedWalking) {
    aud.stopInfiniteSound(0);
  }
}

function checkCollisions() {
  // check target collisions
  if (settings.targets) {
    targets.forEach((target) => {
      if (!target.wasGrabbed) {
        const deltaX = Math.abs(player.x - target.x);
        const deltaY = Math.abs(player.y - target.y);
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // player has grabbed a target
        if (distance <= 12) {
          target.wasGrabbed = true;
          numberOfGrabbedTargets += 1;
          addNewTarget();
          if (!settings.ai) {
            aud.playSound(1, window.bitmelo.Notes.E3, 48, 0.25, 1);
          }
        }
      }
    });
  }
}

function updateColors() {
  randomColor = Math.floor(Math.random() * 16) + 1;
  setTimeout(updateColors, 100);
}

export function initiateGame(urlSettings) {
  settings = urlSettings;
  player = {
    x: 90,
    y: 50,
    speed: settings.ai ? 0.8 : 0.5,
    isWalking: false,
    flip: 0,
    framesSinceWalkStart: 0,
  };
  if (settings.targets) {
    addNewTarget({
      x: 39,
      y: 30,
    });
  }
  engine.begin();
  settings.morty && moveMorty();
}

export async function fireAction(key, wait = 0) {
  fireWindowEvent(key, true);
  return new Promise((resolve) => {
    setTimeout(async () => {
      fireWindowEvent(key, false);
      resolve();
    }, wait);
  });
}

function fireWindowEvent(key, down) {
  window.inp[down ? "_keyDown" : "_keyUp"]({ code: key });
}

export function getPlayer() {
  return player;
}

export function getTargetToFocus() {
  return targets[targets.length - 1];
}

export function getMorty() {
  return morty;
}

export function addNewTarget({ x, y } = {}) {
  targets.push({
    x: x || Math.round(Math.random() * 130 + 30),
    y: y || Math.round(Math.random() * 80 + 25),
    wasGrabbed: false,
    index: getTileIndex(),
  });
}

export function getNumberOfCapturedTargets() {
  return numberOfGrabbedTargets;
}

function getTileIndex() {
  const numberOfCapturedTargets = getNumberOfCapturedTargets();
  if (numberOfCapturedTargets === 5) {
    return 16;
  }
  if (settings.space) {
    return (numberOfCapturedTargets % 4) + 17;
  }
  return 61;
}
