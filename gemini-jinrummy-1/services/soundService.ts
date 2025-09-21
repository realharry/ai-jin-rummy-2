// A simple service for playing game sounds.

const sounds: { [key: string]: HTMLAudioElement } = {};
let isMuted = false;

// URLs for royalty-free sounds from Pixabay
const soundFiles = {
  drawDeck: 'https://cdn.pixabay.com/audio/2022/03/15/audio_b29c10ce3b.mp3',   // Card Slide
  drawDiscard: 'https://cdn.pixabay.com/audio/2021/08/04/audio_513f19dc12.mp3',// Single Card Flip
  discard: 'https://cdn.pixabay.com/audio/2022/03/15/audio_299c8313e3.mp3',    // Card Place
  shuffle: 'https://cdn.pixabay.com/audio/2021/08/04/audio_067b0b5711.mp3',   // Shuffling Cards
  win: 'https://cdn.pixabay.com/audio/2022/11/17/audio_88a20c2e37.mp3',       // Success Fanfare
  lose: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c633a6064f.mp3',      // Negative Beep
  gameWin: 'https://cdn.pixabay.com/audio/2022/08/17/audio_35255a8289.mp3',   // Level Win
  gameLose: 'https://cdn.pixabay.com/audio/2022/05/13/audio_1721fc22b3.mp3'  // Game Over
};

/**
 * Preloads all necessary audio files for the game. This should be called once
 * when the application starts.
 */
export const loadSounds = () => {
  if (Object.keys(sounds).length > 0) return; // Load only once
  for (const key in soundFiles) {
    sounds[key] = new Audio(soundFiles[key as keyof typeof soundFiles]);
    sounds[key].volume = 0.4; // Set a default volume to be less intrusive
  }
};

/**
 * Plays a sound effect by its name. If sounds are muted, this does nothing.
 * @param soundName The name of the sound to play.
 */
export const playSound = (soundName: keyof typeof soundFiles) => {
  if (isMuted || !sounds[soundName]) return;
  
  // Resetting currentTime allows the sound to be played again quickly
  sounds[soundName].currentTime = 0;
  
  sounds[soundName].play().catch(error => {
    // Autoplay is often restricted by browsers until the user interacts with the page.
    // We can safely ignore these errors as they are expected.
    console.warn(`Could not play sound '${soundName}': ${error.message}`);
  });
};

/**
 * Toggles the mute state for all sounds.
 * @returns The new mute state (true if muted, false otherwise).
 */
export const toggleMute = (): boolean => {
  isMuted = !isMuted;
  return isMuted;
};

/**
 * Gets the current mute state.
 * @returns The current mute state.
 */
export const getIsMuted = (): boolean => {
  return isMuted;
};