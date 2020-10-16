import {
  fireAction,
  getPlayer,
  addNewTarget,
  getTargetToFocus,
  getNumberOfCapturedTargets,
  getMorty,
} from "../game/game";
import pretrained from "./pretrained/model.json";
import assert from "assert";
import { setChartData } from "../components/ChartContainer";

const RL = window.RL;
const TIMEOUT = 60; // mins
// agent parameter spec to play with (this gets eval()'d on Agent reset)
const spec = {
  update: "qlearn", // qlearn | sarsa algorithm
  gamma: 0.9, // discount factor, [0, 1)
  epsilon: 0.3, // initial epsilon for epsilon-greedy policy, [0, 1)
  alpha: 0.001, // value function learning rate
  experience_add_every: 10, // number of time steps before we add another experience to replay memory
  experience_size: 5000, // size of experience replay memory
  learning_steps_per_iteration: 20,
  tderror_clamp: 1.0, // for robustness
  num_hidden_units: 100, // number of neurons in hidden layer
};

const rewards = [];

let agent;
export function loadPretrained() {
  agent.fromJSON(pretrained);
}

let tick;
export function startAI() {
  tick();
}

export async function initAI(settings) {
  let steps = 0;
  let run = true;
  let actor = getPlayer();
  let target = getTargetToFocus();
  let morty = getMorty();

  const env = {
    getNumStates() {
      return 2 + (settings.morty ? 3 : 0) + (settings.targets ? 2 : 0);
    },
    getMaxNumActions() {
      return 8;
    },
  };
  agent = new RL.DQNAgent(env, spec);

  setTimeout(() => (run = false), TIMEOUT * 1000 * 60);

  tick = function () {
    requestAnimationFrame(async function () {
      await runLoop();
      if (run) {
        tick();
      }
    });
  };

  async function runLoop() {
    actor = getPlayer();
    target = getTargetToFocus();
    morty = getMorty();

    let previousDistanceTarget = target ? calcDistance(target, actor) : 0;
    let previousDistanceEnemy = settings.morty ? calcDistance(morty, actor) : 0;

    let inputs = [actor.x, actor.y];
    if (settings.targets) {
      inputs = inputs.concat([target?.x, target?.y]);
    }
    if (settings.morty) {
      inputs = inputs.concat([morty?.x, morty?.y, morty?.direction]);
    }

    assert.strictEqual(
      inputs.length,
      env.getNumStates(),
      "The Input Size dose not match the Inputs Array length"
    );

    // act on agent action
    const action = agent.act(inputs);
    steps++;
    const actions = {
      0: () => fireAction("ArrowRight", 50),
      1: () => fireAction("ArrowLeft", 50),
      2: () => fireAction("ArrowUp", 50),
      3: () => fireAction("ArrowDown", 50),
      4: () => fireAction("ArrowRight", 200),
      5: () => fireAction("ArrowLeft", 200),
      6: () => fireAction("ArrowUp", 200),
      7: () => fireAction("ArrowDown", 200),
    };
    actions[action] && (await actions[action]());

    actor = getPlayer();
    target = getTargetToFocus();
    const currentDistanceTarget = target ? calcDistance(target, actor) : 0;
    const currentDistanceEnemy = settings.morty
      ? calcDistance(morty, actor)
      : 0;

    // check if the player hit the edge
    const actorInEdge =
      actor.x <= 25 ||
      actor.x >= window.scr.width - 25 ||
      actor.y <= 25 ||
      actor.y >= window.scr.height - 25;

    // calculate the reward
    const reward = calculateReward({
      previousDistanceTarget,
      currentDistanceTarget,
      actorInEdge,
      target,
      previousDistanceEnemy,
      currentDistanceEnemy,
      settings,
    });
    // learn for the next round
    agent.learn(reward);
    rewards.push((rewards[rewards.length - 1] || 0) + reward);

    // check if the target was grabbed - to populate a new one
    if (target?.wasGrabbed) {
      addNewTarget();
      if (getNumberOfCapturedTargets() > 60) {
        run = false;
      } else {
        actor = getPlayer();
        target = getTargetToFocus();
      }
    }

    if (!(steps % 5)) {
      setChartData(rewards);
    }
  }
}

function calcDistance(a, b) {
  return Math.abs(Math.hypot(a?.x - b.x, a?.y - b.y));
}

function calculateReward({
  previousDistanceTarget,
  currentDistanceTarget,
  actorInEdge,
  target,
  previousDistanceEnemy,
  currentDistanceEnemy,
  settings,
}) {
  if (target?.wasGrabbed) {
    // give zero reward for a grabbed target
    return 0;
  }
  let targetReward = 0;
  let enemyReward = 0;
  if (settings.targets) {
    if (actorInEdge) {
      // give very negative reward for hitting the edge
      return -(currentDistanceTarget / 300);
    }
    // give reward for getting closer to the target
    targetReward =
      (previousDistanceTarget - currentDistanceTarget) /
      (previousDistanceTarget || 1);
  }
  if (settings.morty) {
    // give reward for getting away from enemy
    enemyReward =
      -(previousDistanceEnemy - currentDistanceEnemy) /
      (previousDistanceEnemy || 1);
  }
  // sum both rewards
  return targetReward + enemyReward;
}
