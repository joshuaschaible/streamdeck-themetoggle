import streamDeck from "@elgato/streamdeck";
import { ToggleDarkMode } from "./actions/toggle-dark-mode";

// Enable trace logging for debugging
streamDeck.logger.setLevel("trace");

// Register actions before connecting
streamDeck.actions.registerAction(new ToggleDarkMode());

// Connect to Stream Deck (must be called last)
streamDeck.connect();
