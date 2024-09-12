import { useState } from 'react';

const Voting = () => {
  const hardCoadedMovies = [
    { name: 'Matrix', voteCount: '10' },
    { name: 'Godfather', voteCount: '5' },
    { name: 'Batman', voteCount: '20' },
  ];

  const [walletAddress, setWalletAddress] = useState('');
  const [status, setStatus] = useState('Unable to connect to the blockchain');
  const [pollStatus, setPollStatus] = useState('Not Started');
  const [movies, setMovies] = useState(hardCoadedMovies);
  const [hasVoted, setHasVoted] = useState(false);
  const [winner, setWinner] = useState('Batman');

  return (
    <div className="container">
      <div className="box">
        <div className="header">
          {!walletAddress && (
            <button className="walletButton">Connect Wallet</button>
          )}
          {walletAddress && walletAddress > 0 && (
            <p className="walletAddress">
              Connected:
              {`${walletAddress.substring(0, 6)}...${walletAddress.substring(
                walletAddress.length - 4
              )}`}
            </p>
          )}
        </div>
        <button className="Start Polll">Start Poll</button>
        <h3>Vote for a movie:</h3>
        <div className="moviesList">
          {movies.map((movie, index) => (
            <div
              key={index}
              className="candidateBox"
            >
              <button
                className="voteButton"
                disabled={!walletAddress || hasVoted}
              >
                {movie.name}
              </button>
              <p className="voteCount">
                {movie.voteCount === '1'
                  ? `${movie.voteCount} vote`
                  : `${movie.voteCount} votes`}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Voting;
