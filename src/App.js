import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase'; // <-- Using your supabase.js file
import './App.css';

function App() {
  const [playerName, setPlayerName] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [message, setMessage] = useState('');
  const [guessesLeft, setGuessesLeft] = useState(8);
  const [players, setPlayers] = useState([]);
  const [previousGuesses, setPreviousGuesses] = useState([]);
  const [timer, setTimer] = useState(0);
  const [showSilhouette, setShowSilhouette] = useState(false);
  const [gameOver, setGameOver] = useState(false); // Track game over state
  const intervalRef = useRef(null);

  // Fetch players from Supabase instead of axios/local
  useEffect(() => {
    async function fetchPlayers() {
      const { data, error } = await supabase
        .from('players') // Table name in Supabase
        .select('*');

      if (error) {
        console.error('Error fetching player data:', error);
        return;
      }

      // Store all players in state
      setPlayers(data);
      // Pick a random player from the fetched data
      pickRandomPlayer(data);
    }

    fetchPlayers();
  }, []);

  const pickRandomPlayer = (playersList) => {
    if (playersList.length > 0) {
      const randomIndex = Math.floor(Math.random() * playersList.length);
      setSelectedPlayer(playersList[randomIndex]);
      setGuessesLeft(8);
      setMessage('');
      setPreviousGuesses([]);
      setTimer(0); // Reset timer to 0
      setGameOver(false); // Reset game over state when a new player is selected

      startTimer(); // Start the timer immediately after resetting it
    }
  };

  const capitalizeName = (name) => {
    return name
      .split(' ')
      .map(
        (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
      .join(' ');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedPlayer || guessesLeft <= 0) return;

    const correctedPlayerName = capitalizeName(playerName);
    const foundPlayer = players.find(
      (p) =>
        p.name.toLowerCase().trim() === correctedPlayerName.toLowerCase().trim()
    );

    if (foundPlayer) {
      const guessFeedback = getGuessFeedback(foundPlayer);
      setPreviousGuesses([
        ...previousGuesses,
        { guess: correctedPlayerName, feedback: guessFeedback },
      ]);

      if (foundPlayer.id === selectedPlayer.id) {
        setMessage(`🎉 Correct! The player was ${selectedPlayer.name}!`);
        clearInterval(intervalRef.current); // Stops the timer once the player is correct
        setShowSilhouette(true); // Show silhouette after correct guess
        setGameOver(true); // End the game when the player is correct
      } else {
        setGuessesLeft((prev) => (prev > 0 ? prev - 1 : 0));
        setMessage('❌ Incorrect! Try again.');
      }
    } else {
      setMessage("❌ Player not found! Make sure you're guessing the correct name.");
    }

    if (guessesLeft <= 1) {
      clearInterval(intervalRef.current);
      setMessage(`Game Over! The correct player was ${selectedPlayer.name}.`);
      setGameOver(true); // End the game when guesses run out
    }

    setPlayerName('');
  };

  const getGuessFeedback = (guessedPlayer) => {
    let feedback = {};
    feedback.team = `${guessedPlayer.team} ${
      guessedPlayer.team === selectedPlayer.team ? '✅' : '❌'
    }`;
    feedback.position =
      guessedPlayer.position === selectedPlayer.position ? '✅' : '❌';
    feedback.confText = `${guessedPlayer.conf} ${
      guessedPlayer.conf === selectedPlayer.conf ? '✅' : '❌'
    }`;
    feedback.conf =
      guessedPlayer.conf === selectedPlayer.conf ? '✅' : '❌';

    const parseHeight = (height) => {
      const [feet, inches] = height.split("'").map((part) => parseInt(part, 10));
      return feet * 12 + inches;
    };

    const guessedHeightInches = parseHeight(guessedPlayer.height);
    const selectedHeightInches = parseHeight(selectedPlayer.height);

    feedback.height = {
      value:
        guessedHeightInches === selectedHeightInches
          ? guessedPlayer.height
          : `${guessedPlayer.height}`,
      emoji:
        guessedHeightInches === selectedHeightInches
          ? '✅'
          : guessedHeightInches < selectedHeightInches
          ? '⬆️'
          : '⬇️',
    };

    const ageFeedback =
      guessedPlayer.age === selectedPlayer.age
        ? `✅ ${guessedPlayer.age}`
        : guessedPlayer.age < selectedPlayer.age
        ? `⬆️ ${guessedPlayer.age}`
        : `⬇️ ${guessedPlayer.age}`;

    feedback.age = ageFeedback;

    const guessedNumber = parseInt(guessedPlayer.number, 10);
    const selectedNumber = parseInt(selectedPlayer.number, 10);

    const numberFeedback =
      guessedNumber === selectedNumber
        ? '✅'
        : Math.abs(guessedNumber - selectedNumber) === 1
        ? '🟨'
        : guessedNumber < selectedNumber
        ? '⬆️'
        : '⬇️';

    feedback.numberMatch = `${guessedNumber} ${numberFeedback}`;
    feedback.positionText = guessedPlayer.position;
    feedback.position =
      guessedPlayer.position === selectedPlayer.position ? '✅' : '❌';

    return feedback;
  };

  const formatTime = (timeInSeconds) => {
    const hours = String(Math.floor(timeInSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((timeInSeconds % 3600) / 60)).padStart(
      2,
      '0'
    );
    const seconds = String(timeInSeconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const startTimer = () => {
    clearInterval(intervalRef.current); // Clear any existing interval
    intervalRef.current = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000); // Start the timer at 0
  };

  const handlePlayAgain = () => {
    pickRandomPlayer(players);
  };

  useEffect(() => {
    if (selectedPlayer) {
      startTimer(); // Start the timer as soon as the game starts
    }

    return () => clearInterval(intervalRef.current); // Cleanup interval when game ends
  }, [selectedPlayer]);

  return (
    <div className="App">
      <h1>PHEE</h1>
      <p>Guesses Left: {guessesLeft}</p>
      <p>Time: {formatTime(timer)}</p>

      {guessesLeft > 0 ? (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter full player name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            disabled={gameOver || guessesLeft <= 0} // Disable input after game over or guesses run out
            className={gameOver || guessesLeft <= 0 ? 'disabled-input' : ''}
          />
          <button type="submit" disabled={gameOver || guessesLeft <= 0}>
            Guess
          </button>
        </form>
      ) : (
        <div>
          <p>Game Over! The correct player was {selectedPlayer?.name}.</p>
          <button onClick={handlePlayAgain}>Play Again</button>
        </div>
      )}

      {message && !guessesLeft && <p>{message}</p>}

      {selectedPlayer && (
        <div className="silhouette-container">
          <button
            onClick={() => setShowSilhouette((prev) => !prev)}
            disabled={gameOver || guessesLeft <= 0}
            className={gameOver || guessesLeft <= 0 ? 'disabled-button' : ''}
          >
            Show Silhouette
          </button>

          {message.includes('Correct!') ? (
            <img
              src={`/images/${selectedPlayer.name
                .toLowerCase()
                .replace(' ', '')}-actual.png`}
              alt="Player actual"
              className="actual-image"
            />
          ) : (
            showSilhouette && (
              <img
                src={`/images/${selectedPlayer.name
                  .toLowerCase()
                  .replace(' ', '')}-headshot.png`}
                alt="Player silhouette"
                className="silhouette"
              />
            )
          )}

          {message && guessesLeft > 0 && !message.includes('Correct!') && (
            <p>{message}</p>
          )}
        </div>
      )}

      {message.includes('Correct!') && (
        <div>
          <p>{message}</p>
          <button onClick={handlePlayAgain}>Play Again</button>
        </div>
      )}

      {previousGuesses.length > 0 && (
        <div className="game-info">
          <h3>Previous Guesses:</h3>
          <div className="info-box">
            <div className="info-item-wrapper title">
              <div className="info-label">Name</div>
              <div className="info-label">Team</div>
              <div className="info-label">Pos</div>
              <div className="info-label">Conf</div>
              <div className="info-label">Ht</div>
              <div className="info-label">Age</div>
              <div className="info-label">#</div>
            </div>
            {previousGuesses.map((prevGuess, index) => (
              <div key={index} className="info-item-wrapper guess">
                <div className="info-item">{prevGuess.guess}</div>
                <div className="info-item">{prevGuess.feedback.team}</div>
                <div className="info-item">
                  {prevGuess.feedback.positionText}{' '}
                  {prevGuess.feedback.position}
                </div>
                <div className="info-item">{prevGuess.feedback.confText}</div>
                <div className="info-item">
                  {prevGuess.feedback.height.value}{' '}
                  {prevGuess.feedback.height.emoji}
                </div>
                <div className="info-item">{prevGuess.feedback.age}</div>
                <div className="info-item">
                  {prevGuess.feedback.numberMatch}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;























































  







