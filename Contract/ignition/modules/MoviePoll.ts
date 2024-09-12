// ignition/modules/MoviePoll.ts
import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const moviePollModule = buildModule('MoviePoll', (m) => {
  // Get the contract factory
  const moviePoll = m.contract('MoviePoll');

  return {
    moviePoll,
  };
});

export default moviePollModule;
