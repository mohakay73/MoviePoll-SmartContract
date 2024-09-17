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

export const checkIfVoted = async (address) => {
  const voted = await moviePollContract.methods.userVotes(address).call();
  return voted;
};

export const getPollStatus = async () => {
  const state = await moviePollContract.methods.getPollStatus().call();
  return state;
};

export const mapPollStatus = (state) => {
  switch (parseInt(state)) {
    case 0:
      return 'NotStarted';
    case 1:
      return 'Voting';
    case 2:
      return 'Ended';
    default:
      return 'Unknown state';
  }
};

export const eventListeners = (
  setStatus,
  setVotingState,
  setWinner,
  loadCandidates
) => {
  moviePollContract.events.votingStarted({}, (err) => {
    if (err) {
      setStatus(err.message);
    } else {
      setVotingState('Ongoing');
    }
  });

  moviePollContract.events.VoteCast({}, async (err, data) => {
    if (err) {
      setStatus(err.message);
    } else {
      setStatus(
        `Your vote for ${data.returnValues[0]} has been successfully cast!`
      );
    }
  });

  moviePollContract.events.VotingFinished({}, (err, data) => {
    if (err) {
      setStatus(err.message);
    } else {
      setVotingState('Finished');
      setWinner(data.returnValues.winner);
    }
  });
};
