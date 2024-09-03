// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

contract MoviePoll{
    
     // Enum to define the status of a poll
    enum PollStatus { NotStarted, Voting, Ended }

    // Struct to represent a poll
    struct Poll {
        mapping(string => uint) votes;
        mapping(string => bool) validMovies;
        mapping(address => string) userVotes;
        string[] movies;
        uint endTime;
        PollStatus status;
        string winner;
    }

    Poll public currentPoll;
    address public owner;

    // Event to log when voting starts
    event VotingStarted(uint endTime);

    // Event to log when a vote is cast
    event VoteCast(address voter, string movie);

    // Event to log when a vote is changed
    event VoteChanged(address voter, string oldMovie, string newMovie);

    // Event to log when voting ends
    event VotingEnded(string winner);

    // Modifier to restrict access to the contract owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    // Modifier to ensure a poll is active
    modifier pollActive() {
        require(currentPoll.status == PollStatus.Voting, "Voting is not open");
        require(block.timestamp <= currentPoll.endTime, "Voting period has ended");
        _;
    }

    // Constructor to set the contract deployer as the owner
    constructor() {
        owner = msg.sender;
    }

    // Function to start a new poll (only owner)
    function startPoll(string[] memory _movies, uint _durationInMinutes) public onlyOwner {
        require(currentPoll.status != PollStatus.Voting, "A poll is already active");

        // Initialize a new poll
        delete currentPoll;  // Reset the current poll
        for (uint i = 0; i < _movies.length; i++) {
            currentPoll.validMovies[_movies[i]] = true;
        }
        currentPoll.movies = _movies;
        currentPoll.endTime = block.timestamp + (_durationInMinutes * 1 minutes);
        currentPoll.status = PollStatus.Voting;

        emit VotingStarted(currentPoll.endTime);
    }

    // Function to cast a vote (only for first-time voters)
    function vote(string memory _movie) public pollActive {
        require(currentPoll.validMovies[_movie], "The selected movie is not in the poll");
        require(bytes(currentPoll.userVotes[msg.sender]).length == 0, "You have already voted");

        // Record the user's vote
        currentPoll.userVotes[msg.sender] = _movie;
        currentPoll.votes[_movie]++;

        emit VoteCast(msg.sender, _movie);
    }

    // Function to change an existing vote (re-vote)
    function revote(string memory _newMovie) public pollActive {
        require(currentPoll.validMovies[_newMovie], "The selected movie is not in the poll");
        require(bytes(currentPoll.userVotes[msg.sender]).length > 0, "You have not voted yet");

        // Get the user's previous vote and update it
        string memory previousVote = currentPoll.userVotes[msg.sender];
        if (keccak256(abi.encodePacked(previousVote)) != keccak256(abi.encodePacked(_newMovie))) {
            currentPoll.votes[previousVote]--;  // Decrement the vote count for the old movie
            currentPoll.votes[_newMovie]++;     // Increment the vote count for the new movie
            currentPoll.userVotes[msg.sender] = _newMovie;
            emit VoteChanged(msg.sender, previousVote, _newMovie);
        }
    }

    // Function to end the voting process and calculate the winner
    function endPoll() public onlyOwner {
        require(currentPoll.status == PollStatus.Voting, "Voting is not in progress");
        require(block.timestamp > currentPoll.endTime, "Voting period is still active");

        currentPoll.status = PollStatus.Ended;

        // Calculate the winner
        uint maxVotes = 0;
        string memory winningMovie = "";
        for (uint i = 0; i < currentPoll.movies.length; i++) {
            string memory movie = currentPoll.movies[i];
            if (currentPoll.votes[movie] > maxVotes) {
                maxVotes = currentPoll.votes[movie];
                winningMovie = movie;
            }
        }
        currentPoll.winner = winningMovie;

        emit VotingEnded(winningMovie);
    }

    // Function to retrieve the winner of the poll
    function getWinner() public view returns (string memory) {
        require(currentPoll.status == PollStatus.Ended, "Voting has not ended yet");
        return currentPoll.winner;
    }
}



