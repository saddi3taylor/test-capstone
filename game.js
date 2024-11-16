// Implementing Object-Oriented Concepts: Inheritance, Polymorphism, and Encapsulation

// Base class: GameEntity
class GameEntity {
    constructor() {
        this.level = 0;
        this.score = 0;
    }

    startGame() {
        this.level = 0;
        this.score = 0;
        this.resetGame();
    }

    resetGame() {
        $("#level-title").text("Level " + this.level);
        $("#game-over-screen").hide();
    }
}

// Inherited Class: SimonGame
class SimonGame extends GameEntity {
    constructor() {
        super();
        this.buttonColors = ["red", "blue", "green", "yellow"];
        this.gamePattern = [];
        this.userClickedPattern = [];
        this.inactivityTimer = null;
        this.timeoutLimit = 180000; // 3 minutes timeout
        this.gameHistory = JSON.parse(localStorage.getItem('gameHistory')) || []; // Load from localStorage
        this.saveScoreOnce = false; // Prevents multiple score saves per game
        this.colorIndex = 0;
    }

    nextSequence() {
        this.userClickedPattern = [];
        this.level++;
        $("#level-title").text("Level " + this.level);
        let randomNumber = Math.floor(Math.random() * this.buttonColors.length);
        let randomChosenColor = this.buttonColors[randomNumber];
        this.gamePattern.push(randomChosenColor);
        $("#" + randomChosenColor).fadeIn(100).fadeOut(100).fadeIn(100);
        this.playSound(randomChosenColor);
    }

    playSound(name) {
        let audio = new Audio('sounds/' + name + '.mp3');
        audio.play();
    }

    animatePress(currentColor) {
        $("#" + currentColor).addClass("pressed");
        setTimeout(() => $("#" + currentColor).removeClass("pressed"), 100);
    }

    checkAnswer(currentLevel) {
        if (this.gamePattern[currentLevel] === this.userClickedPattern[currentLevel]) {
            if (this.userClickedPattern.length === this.gamePattern.length) {
                this.score++;
                setTimeout(() => this.nextSequence(), 1000);
            }
        } else {
            this.playSound("wrong");
            this.showGameOverScreen();
        }
    }

    resetInactivityTimer() {
        clearTimeout(this.inactivityTimer);
        this.inactivityTimer = setTimeout(() => this.showSessionTimeoutPopup(), this.timeoutLimit);
    }

    showSessionTimeoutPopup() {
        $("#session-timeout-popup").show();
    }

    showGameOverScreen() {
        $("body").addClass("game-over");
        $("#game-screen").hide();
        $("#final-score").text("Score: " + this.score);
        $("#player-initials").val("");
        $("#game-over-screen").show();
        this.gamePattern = []; // Reset game pattern to start fresh after game over
        this.userClickedPattern = []; // Reset user pattern as well
    }

    saveGameHistory(initials) {
        const currentDate = new Date();
        const dateString = currentDate.toLocaleDateString();
        const timeString = currentDate.toLocaleTimeString();
        this.gameHistory.push({
            initials: initials,
            score: this.score,
            date: dateString,
            time: timeString
        });
        localStorage.setItem('gameHistory', JSON.stringify(this.gameHistory)); // Save to localStorage
    }

    updateGameHistory() {
        $("#history-list").empty();
        let minScore = parseInt($("#min-score").val()) || 0;
        let initialsFilter = $("#initials-filter").val().toUpperCase();
        let filteredHistory = this.gameHistory.filter(game =>
            game.score >= minScore &&
            (!initialsFilter || game.initials.startsWith(initialsFilter))
        );

        if (this.gameHistory.length === 0) {
            $("#history-list").append("<li>Play a game to see your score stored here!</li>");
        } else if (filteredHistory.length === 0) {
            $("#history-list").append("<li>No games meet the criteria.</li>");
        } else {
            filteredHistory.forEach((game, index) => {
                $("#history-list").append(
                    `<li>
                        <span class="score-details">${game.initials}: Score - ${game.score} - ${game.date} ${game.time}</span>
                        <i class="fa-solid fa-pen-to-square edit-icon" data-index="${index}"></i>
                        <i class="fa-solid fa-trash-can delete-icon" data-index="${index}"></i>
                    </li>`
                );
            });
        }
    }

    deleteScore(index) {
        this.gameHistory.splice(index, 1);
        localStorage.setItem('gameHistory', JSON.stringify(this.gameHistory));
        this.updateGameHistory();
    }

    startCountdown() {
        let countdown = 3;
        $("#level-title").text("Get Ready...");
        const countdownInterval = setInterval(() => {
            $("#level-title").text(countdown);
            countdown--;
            if (countdown < 0) {
                clearInterval(countdownInterval);
                this.startGame();
                this.nextSequence();
            }
        }, 1000);
    }

    animateTitles() {
        const colors = ["red", "blue", "green", "yellow"];
        const gameTitle = document.querySelector(".game-title");
        const gameOverTitle = document.querySelector(".game-over-title");
        const helpTitle = document.querySelector(".popup-title");
        const historyTitle = document.querySelector(".popup-title-history");
        const sessionTimeoutTitle = document.querySelector(".popup-title-session");
        const deleteConfirmationTitle = document.querySelector(".popup-title-delete");
        const editTitle = document.querySelector(".popup-title-edit");

        [gameTitle, gameOverTitle, helpTitle, historyTitle, sessionTimeoutTitle, deleteConfirmationTitle, editTitle].forEach(title => {
            if (title) title.style.color = colors[this.colorIndex];
        });
        this.colorIndex = (this.colorIndex + 1) % colors.length;
    }

    resetGameToStartScreen() {
        $("body").removeClass("game-over");
        $("#game-over-screen, #game-screen, #help-popup, #history-popup, #session-timeout-popup, #delete-popup, #edit-popup").hide();
        $("#start-screen").show();
        $("#help-button, #game-history-button").hide(); // Hide buttons on start screen
        this.gamePattern = []; // Clear game pattern on reset
        this.userClickedPattern = []; // Clear user pattern on reset
    }
}

// Event handlers
const game = new SimonGame();

$(document).on("mousemove keypress click", () => game.resetInactivityTimer());

$("#start-bttn").click(function() {
    $("#start-screen").hide();
    $("#game-screen").show();
    $("#help-button, #game-history-button").show();
    game.startCountdown();
});

$(".btn").click(function() {
    let userChosenColor = $(this).attr("id");
    game.userClickedPattern.push(userChosenColor);
    game.playSound(userChosenColor);
    game.animatePress(userChosenColor);
    game.checkAnswer(game.userClickedPattern.length - 1);
});

$("#restart-bttn").click(function() {
    $("body").removeClass("game-over");
    $("#game-over-screen").hide();
    $("#game-screen").show();
    game.saveScoreOnce = false; // Reset save button to allow saving again
    game.startCountdown();
});

$("#save-score-btn").click(function() {
    const initials = $("#player-initials").val().toUpperCase();
    if (initials && !game.saveScoreOnce) { // Prevent multiple saves for the same game
        game.saveGameHistory(initials);
        game.saveScoreOnce = true; // Block future saves for this game session
        $("#game-over-screen").hide();
        $("#game-history-button").click(); // Show game history after saving
    } else if (!initials) {
        alert("Please enter your initials to save the score.");
    }
});

// Show and hide help popup
$("#help-button").click(function() {
    $("#help-popup").show();
});
$("#close-popup").click(function() {
    $("#help-popup").hide();
});

// Show and hide game history popup
$("#game-history-button").click(function() {
    game.updateGameHistory();
    $("#history-popup").show();
});

$("#close-history").click(function() {
    $("#history-popup").hide();
    if ($("body").hasClass("game-over")) {
        $("#game-over-screen").show(); // Restore game over screen if game was over
    }
});

// OK button on session timeout popup
$("#timeout-ok-btn").click(function() {
    $("#session-timeout-popup").hide();
    game.resetGameToStartScreen();
});

// Update Game History with Search by score and initials
$("#min-score, #initials-filter").on("input", function() {
    game.updateGameHistory();
});

// Delete score event
$(document).on("click", ".delete-icon", function() {
    const index = $(this).data("index");
    const gameToDelete = game.gameHistory[index];
    $("#delete-details").text(`${gameToDelete.initials}: Score - ${gameToDelete.score} - ${gameToDelete.date} ${gameToDelete.time}`);
    $("#delete-popup").data("index", index).show();
});

// Confirm delete
$("#delete-yes-btn").click(function() {
    const index = $("#delete-popup").data("index");
    game.deleteScore(index);
    $("#delete-popup").hide();
});

// Cancel delete
$("#delete-no-btn").click(function() {
    $("#delete-popup").hide();
});

// Edit score initials event
$(document).on("click", ".edit-icon", function() {
    const index = $(this).data("index");
    const currentInitials = game.gameHistory[index].initials;
    $("#edit-initials").val(currentInitials);
    $("#edit-popup").data("index", index).show();
});

// Save edited initials
$("#save-edit-btn").click(function() {
    const index = $("#edit-popup").data("index");
    const newInitials = $("#edit-initials").val().toUpperCase();
    if (newInitials) {
        game.gameHistory[index].initials = newInitials;
        localStorage.setItem('gameHistory', JSON.stringify(game.gameHistory));
        game.updateGameHistory();
        $("#edit-popup").hide();
    } else {
        alert("Please enter valid initials.");
    }
});

// Cancel edit
$("#cancel-edit-btn").click(function() {
    $("#edit-popup").hide();
});

// Reset game to the start screen
$("#help-button, #game-history-button").hide(); // Hide help and game history buttons initially

// Animate titles at intervals
game.animateTitles();
setInterval(() => game.animateTitles(), 1000);
