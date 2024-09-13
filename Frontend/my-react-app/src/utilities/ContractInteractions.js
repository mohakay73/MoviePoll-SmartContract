import { createAlchemyWeb3 } from '@alch/alchemy-web3';
import contractABI from '../utilities/contract-abi.json';

const alchemyUrl = process.env.REACT_APP_ALCHEMY_URL;
console.log('Alchemy URL:', alchemyUrl);

const web3 = createAlchemyWeb3(alchemyUrl);

const contractAddress = process.env.REACT_APP_CONTRACT;

const moviePollContract = new web3.eth.Contract(contractABI, contractAddress);

// ... rest of your code

export const connectWallet = async () => {
  if (window.ethereum) {
    try {
      const addressArray = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      return {
        address: addressArray[0],
        status: '',
      };
    } catch (err) {
      return {
        address: '',
        status: '😥 ' + err.message,
      };
    }
  } else {
    return {
      address: '',
      status: (
        <span>
          🦊 Please install MetaMask to use this app <br />
          <a
            target="_blank"
            href="https://metamask.io/download.html"
          >
            MetaMask
          </a>
        </span>
      ),
    };
  }
};

export const getCurrentWalletConnected = async () => {
  if (window.ethereum) {
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_accounts',
      });
      if (accounts.length > 0) {
        return {
          address: accounts[0],
          status: '',
        };
      }
    } catch (err) {
      return {
        address: '',
        status: err.message,
      };
    }
  } else {
    return {
      address: '',
      status: (
        <span>
          🦊 Please install MetaMask to use this app <br />
          <a
            target="_blank"
            href="https://metamask.io/download.html"
          >
            MetaMask
          </a>
        </span>
      ),
    };
  }
};

export const checkIfVoted = async (address) => {
  const voted = await moviePollContract.methods.userVotes(address).call();
  return voted;
};

export const walletListener = (
  setWalletAddress,
  setStatus,
  setHasVoted,
  checkIfVoted
) => {
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', async (accounts) => {
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        const voted = await checkIfVoted(accounts[0]);
        setHasVoted(voted);
        setStatus('');
      } else {
        setWalletAddress('');
        setHasVoted(false);
        setStatus('🦊 Connect to Metamask using the top right button.');
      }
    });
  }
};

export const startPoll = async (walletAddress, movies, durationInMinutes) => {
  try {
    const durationInSeconds = durationInMinutes * 60;
    const filteredMovies = movies.filter((movie) => movie.trim() !== '');
    await moviePollContract.methods
      .startPoll(filteredMovies, durationInSeconds)
      .send({ from: walletAddress });
    return {
      status: 'Successfully started the poll',
    };
  } catch (err) {
    return {
      status: 'Error starting the poll' + err.message,
    };
  }
};

export const vote = async (walletAddress, movie) => {
  try {
    await moviePollContract.methods.vote(movie).send({ from: walletAddress });
    return {
      status: `Successfully voted for ${movie}`,
    };
  } catch (err) {
    return {
      status: 'Error voting: ' + err.message,
    };
  }
};
