const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('MoviePolll', function () {
  async function deployMoviePollFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const MoviePoll = await ethers.getContractFactory('MoviePoll');
    const moviePoll = await MoviePoll.deploy();
    return { moviePoll, owner, addr1, addr2 };
  }

  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      const { moviePoll, owner } = await deployMoviePollFixture();
      expect(await moviePoll.owner()).to.equal(owner.address);
    });
  });

  describe('Start Poll', function () {
    it('Should allow the owner to start a poll', async function () {
      const { moviePoll, owner } = await deployMoviePollFixture();
      await moviePoll.connect(owner).startPoll(['Movie1', 'Movie2'], 10);

      const status = await moviePoll.getPollStatus();
      expect(status).to.equal(1);
    });

    it('Should not allow a non-owner to start a poll', async function () {
      const { moviePoll, addr1 } = await deployMoviePollFixture();
      await expect(
        moviePoll.connect(addr1).startPoll(['Movie1', 'Movie2'], 10)
      ).to.be.revertedWith('Only the owner can perform this action');
    });
  });

  describe('Vote', function () {
    it('Should allow voters to vote', async function () {
      const { moviePoll, addr1 } = await deployMoviePollFixture();
      await moviePoll.startPoll(['Movie1', 'Movie2'], 10);
      await moviePoll.connect(addr1).vote('Movie1');
      const votes = await moviePoll.getVotes('Movie1');
      expect(votes).to.equal(1);
    });

    it('Should not allow voting for an invalid movie', async function () {
      const { moviePoll, addr1 } = await deployMoviePollFixture();
      await moviePoll.startPoll(['Movie1', 'Movie2'], 10);
      await expect(
        moviePoll.connect(addr1).vote('InvalidMovie')
      ).to.be.revertedWith('The selected movie is not in the poll');
    });

    it('Should not allow a voter to vote twice', async function () {
      const { moviePoll, addr1 } = await deployMoviePollFixture();
      await moviePoll.startPoll(['Movie1', 'Movie2'], 10);
      await moviePoll.connect(addr1).vote('Movie1');
      await expect(moviePoll.connect(addr1).vote('Movie2')).to.be.revertedWith(
        'You have already voted'
      );
    });

    it('Should allow a voter to change their vote', async function () {
      const { moviePoll, addr1 } = await deployMoviePollFixture();
      await moviePoll.startPoll(['Movie1', 'Movie2'], 10);
      await moviePoll.connect(addr1).vote('Movie1');
      await moviePoll.connect(addr1).revote('Movie2');
      const votesForMovie1 = await moviePoll.getVotes('Movie1');
      const votesForMovie2 = await moviePoll.getVotes('Movie2');
      expect(votesForMovie1).to.equal(0);
      expect(votesForMovie2).to.equal(1);
    });
  });

  describe('End Poll', function () {
    it('Should allow the owner to end the poll', async function () {
      const { moviePoll, owner, addr1 } = await deployMoviePollFixture();
      await moviePoll.startPoll(['Movie1', 'Movie2'], 10);

      await moviePoll.connect(addr1).vote('Movie1');

      await ethers.provider.send('evm_increaseTime', [600]);
      await ethers.provider.send('evm_mine', []);

      await moviePoll.connect(owner).endPoll();

      const winner = await moviePoll.getWinner();
      expect(winner).to.equal('Movie1');
    });
  });
});
