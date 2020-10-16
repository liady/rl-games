import React, { useCallback, useState } from "react";
import styles from "./GameWrapper.module.scss";
import { useEffect } from "react";
import { initiateGame } from "../game/game";
import { initAI, loadPretrained, startAI } from "../ai/ai";
import { ChartContainer } from "./ChartContainer";
import Button from "./Button";

export default function GameWrapper() {
  const [settings, setSettings] = useState({});
  const [modelLoaded, setModelLoaded] = useState(false);
  useEffect(() => {
    const settings = getSettingsFromUrl();
    document.body.style.backgroundColor = settings.bgColor;
    initiateGame(settings);
    initAI(settings);
    setSettings(settings);
  }, []);
  const loadModel = useCallback(() => {
    loadPretrained();
    setModelLoaded(true);
  }, []);
  const modes = getModesFromSettings(settings);
  return (
    <div className={styles.main}>
      <div id="main-container" className={styles.mainContainer}>
        <div className={styles.gameContainer}>
          {settings.buttons && (
            <div className={styles.modesSelector}>
              <Button
                text="Game"
                selected={modes.game}
                onClick={() => setMode({})}
              ></Button>
              <Button
                text="Game & AI"
                selected={modes.gameAi}
                onClick={() => setMode({ ai: true })}
              ></Button>
              <Button
                text="Space"
                selected={modes.space}
                onClick={() => setMode({ space: true })}
              ></Button>
              <Button
                text="Space & AI"
                selected={modes.spaceAi}
                onClick={() => setMode({ ai: true, space: true })}
              ></Button>
              <Button
                text="Morty & AI"
                selected={modes.mortyAi}
                onClick={() =>
                  setMode({
                    ai: true,
                    space: true,
                    morty: true,
                    notargets: true,
                  })
                }
              ></Button>
              <Button
                text="Morty & Targets"
                selected={modes.mortyTargets}
                onClick={() => setMode({ ai: true, space: true, morty: true })}
              ></Button>
            </div>
          )}
          <div id="bitmelo-container"></div>
        </div>
        <div id="made-with">
          Made with{" "}
          <a
            href="http://bitmelo.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Bitmelo
          </a>
        </div>
        {settings.ai ? (
          <div className={styles.buttons}>
            <Button text="Start AI" onClick={startAI} />
            {!settings.morty && (
              <Button
                text={modelLoaded ? "Loaded" : "Load Pretrained"}
                onClick={loadModel}
                disabled={modelLoaded}
              />
            )}
          </div>
        ) : null}
      </div>
      {settings.ai ? <ChartContainer /> : null}
    </div>
  );
}

function getSettingsFromUrl() {
  const url = new URL(document.location);
  const search = url.searchParams;
  return {
    space: !!search.get("space"),
    morty: !!search.get("morty"),
    targets: !(search.get("notargets") || false),
    ai: !!search.get("ai"),
    bgColor: search.get("bg") || "black",
    buttons: !(search.get("nobuttons") || false),
  };
}

function getModesFromSettings({ space, ai, morty, targets } = {}) {
  return {
    game: !space && !ai,
    gameAi: !space && ai,
    space: space && !ai,
    spaceAi: space && ai && !morty && targets,
    mortyAi: space && ai && morty && !targets,
    mortyTargets: space && ai && morty && targets,
  };
}

function setMode(params) {
  document.location.href = `?${Object.keys(params)
    .map((param) => `${param}=true`)
    .join("&")}`;
}
