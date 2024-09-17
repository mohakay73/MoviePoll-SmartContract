import { useState, useEffect } from 'react';
import {
  connectWallet,
  getCurrentWalletConnected,
  walletListener,
  checkIfVoted,
  getPollStatus,
  mapPollStatus,
  eventListeners,
} from './utilities/ContractInteractions';

const Voting = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [status, setStatus] = useState('Unable to connect to the blockchain');
  const [pollStatus, setPollStatus] = useState('');

  const [hasVoted, setHasVoted] = useState(false);
  const [movies, setMovies] = useState(['', '', '']);
  const [duration, setDuration] = useState('');
  const [winner, setWinner] = useState('');

  useEffect(() => {
    const intialize = async () => {
      try {
        const { address, status } = await getCurrentWalletConnected();
        setWalletAddress(address);
        setStatus(status);

        const state = await getPollStatus();
        setPollStatus(mapPollStatus(state));

        if (address) {
          const voted = await checkIfVoted(address);
          setHasVoted(voted);
        }
        walletListener(setWalletAddress, checkIfVoted, setHasVoted, setStatus);
        eventListeners(setStatus, setPollStatus, setWinner);
      } catch (err) {
        setStatus('Errorloading contract data: ' + err.message);
      }
    };
    intialize();
  }, []);

  const handleConnectwallet = async () => {
    const wallletResponse = await connectWallet();
    setWalletAddress(wallletResponse.address);
    setStatus(wallletResponse.status);
  };

  const handleMovieChange = (index, value) => {
    const newMovies = [...movies];
    newMovies[index] = value;
    setMovies(newMovies);
  };

  if (pollStatus === 'Started') {
    return (
      <div>
        <h2>Vote for a Movie</h2>
        {movies.map((movie, index) => (
          <button key={index}>{movie}</button>
        ))}
        {status && <p>{status}</p>}
      </div>
    );
  }
  return (
    <div className="container">
      <div className="box">
        <div className="header">
          {!walletAddress && (
            <button
              className="walletButton"
              onClick={handleConnectwallet}
            >
              Connect Wallet
            </button>
          )}
          {walletAddress && walletAddress > 0 && (
            <p className="walletAddress">
              Connected:
              {`${walletAddress.substring(0, 6)}...${walletAddress.substring(
                walletAddress.length - 4
              )}`}
            </p>
          )}

          <h3>
            {pollStatus === 'Not Started'
              ? 'Voting has not yet started.'
              : pollStatus === 'Finished'
              ? 'Voting has ended.'
              : ''}
          </h3>
        </div>
        <form>
          {movies.map((movie, index) => (
            <input
              key={index}
              type="text"
              value={movie}
              onChange={(e) => handleMovieChange(index, e.target.value)}
              placeholder={`Movie ${index + 1}`}
            />
          ))}
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Poll duration (minutes)"
            required
          />
          <button type="submit">Start Poll</button>
          {status && <p>{status}</p>}
        </form>
        {hasVoted && (
          <p className="alreadyVotedMessage">You have already voted!</p>
        )}

        <button className="walletButton">End Poll</button>
        <button
          className="Revote"
          disabled={!walletAddress || !hasVoted}
        >
          Revote
        </button>

        {pollStatus === 'Ended' && <h3 className="winner">Winner: {winner}</h3>}
      </div>
    </div>
  );
};

export default Voting;
