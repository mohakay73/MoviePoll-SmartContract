import { createAlchemyWeb3 } from '@alch/alchemy-web3';
import contractABI from '../utilities/contract-abi.json';

const alchemyUrl = process.env.REACT_APP_ALCHEMY_URL;
console.log('Alchemy URL:', alchemyUrl);

const web3 = createAlchemyWeb3(alchemyUrl);

const contractAddress = process.env.REACT_APP_CONTRACT;

const moviePollContract = new web3.eth.Contract(contractABI, contractAddress);

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
  try {
    // Get the user's vote
    const userVote = await moviePollContract.methods
      .getUserVote(address)
      .call();
    // If the user's vote is not an empty string, they have voted
    return userVote !== '';
  } catch (err) {
    console.error('Error checking if user voted:', err);
    return false;
  }
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
    const pollStatus = await moviePollContract.methods.getPollStatus().call();
    if (pollStatus !== '0') {
      // '0' corresponds to NotStarted
      return {
        status:
          'Cannot start a new poll: A poll is already active or has ended but not reset.',
      };
    }

    const durationInSeconds = durationInMinutes * 60;
    const filteredMovies = movies.filter((movie) => movie.trim() !== '');
    const result = await moviePollContract.methods
      .startPoll(filteredMovies, durationInSeconds)
      .send({ from: walletAddress });

    return {
      status: 'Successfully started the poll',
      result: result,
    };
  } catch (err) {
    console.error('Error in startPoll:', err);
    return {
      status: 'Error starting the poll: ' + err.message,
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

const pollStatus = await moviePollContract.methods.getPollStatus().call();
console.log('Current poll status:', pollStatus);

async function checkPollDetails() {
  const pollStatus = await moviePollContract.methods.getPollStatus().call();
  console.log('Current poll status:', pollStatus);

  const endTime = await moviePollContract.methods.currentPoll().call().endTime;
  const currentTime = Math.floor(Date.now() / 1000);
  console.log('Poll end time:', new Date(endTime * 1000));
  console.log('Current time:', new Date(currentTime * 1000));
  console.log('Time remaining:', endTime - currentTime, 'seconds');
}

checkPollDetails();

export const endCurrentPoll = async (walletAddress) => {
  try {
    if (!walletAddress) {
      throw new Error('No wallet address provided');
    }

    await moviePollContract.methods.endPoll().send({ from: walletAddress });
    console.log('Poll ended successfully');
    return { status: 'success' }; // Return an object indicating success
  } catch (error) {
    console.error('Error ending poll:', error);
    return { status: 'error', message: error.message }; // Return an error object
  }
};
