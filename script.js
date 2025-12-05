// AI-Driven Drone Delivery - Shared JavaScript

// Scroll Progress Bar
window.addEventListener('scroll', () => {
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + '%';
    }
});

// Smooth Scrolling for anchor links
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Set active navigation link
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });

    // Fade in elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.card, .timeline-item, .challenge-item, .benefit-item, .content-section').forEach(el => {
        observer.observe(el);
    });
});

// Cost Calculator Function
function calculateCost() {
    const deliveries = parseFloat(document.getElementById('deliveries').value) || 0;
    const distance = parseFloat(document.getElementById('distance').value) || 0;
    const days = parseFloat(document.getElementById('days').value) || 0;

    // Traditional delivery cost: $8-12 per delivery (using $10 average)
    const traditionalPerDelivery = 10;
    const traditionalAnnual = deliveries * days * traditionalPerDelivery;

    // Drone delivery cost: $2-4 per delivery (using $3 average)
    const dronePerDelivery = 3;
    const droneAnnual = deliveries * days * dronePerDelivery;

    const savings = traditionalAnnual - droneAnnual;
    const savingsPercent = ((savings / traditionalAnnual) * 100).toFixed(0);

    document.getElementById('traditionalCost').textContent = '$' + traditionalAnnual.toLocaleString();
    document.getElementById('droneCost').textContent = '$' + droneAnnual.toLocaleString();
    document.getElementById('savings').textContent = '$' + savings.toLocaleString() + ' (' + savingsPercent + '%)';
    document.getElementById('calculatorResult').style.display = 'block';
}

// Quiz System
const quizData = [
    {
        question: "What is the projected market size for drone delivery by 2035?",
        options: ["$10 billion", "$29 billion", "$50 billion", "$75 billion"],
        correct: 1,
        explanation: "The drone delivery market is projected to reach $29 billion by 2035, driven by e-commerce growth and technological advancements."
    },
    {
        question: "By what percentage can drone delivery reduce carbon emissions compared to traditional delivery?",
        options: ["30%", "50%", "70%", "90%"],
        correct: 3,
        explanation: "Electric drones can reduce carbon emissions by up to 90% compared to traditional gas-powered delivery vehicles."
    },
    {
        question: "What is the typical payload capacity of current commercial delivery drones?",
        options: ["1-3 lbs", "5-10 lbs", "15-20 lbs", "25-30 lbs"],
        correct: 1,
        explanation: "Most current commercial delivery drones have a payload capacity of 5-10 pounds, limiting them to smaller packages."
    },
    {
        question: "Which regulatory body oversees drone operations in the United States?",
        options: ["FAA", "FCC", "FTC", "DOT"],
        correct: 0,
        explanation: "The Federal Aviation Administration (FAA) is responsible for regulating all aspects of civil aviation, including drone operations."
    },
    {
        question: "What does BVLOS stand for in drone operations?",
        options: ["Beyond Visual Line of Sight", "Basic Visual Logistics Operating System", "Battery Voltage Load Optimization System", "Beyond Vertical Landing Operations"],
        correct: 0,
        explanation: "BVLOS stands for Beyond Visual Line of Sight, referring to drone operations where the pilot cannot directly see the aircraft."
    }
];

let currentQuestion = 0;
let score = 0;
let selectedOption = null;

function loadQuestion() {
    const question = quizData[currentQuestion];
    document.getElementById('quizQuestion').textContent = `Question ${currentQuestion + 1} of ${quizData.length}: ${question.question}`;

    const optionsContainer = document.getElementById('quizOptions');
    optionsContainer.innerHTML = '';

    question.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'quiz-option';
        optionDiv.textContent = option;
        optionDiv.onclick = () => selectOption(index);
        optionsContainer.appendChild(optionDiv);
    });

    document.getElementById('quizSubmit').style.display = 'block';
    document.getElementById('quizNext').style.display = 'none';
    document.getElementById('quizFeedback').style.display = 'none';
    document.getElementById('quizSubmit').disabled = true;
    selectedOption = null;

    updateScore();
}

function selectOption(index) {
    const options = document.querySelectorAll('.quiz-option');
    options.forEach((opt, i) => {
        opt.classList.remove('selected');
        if (i === index) {
            opt.classList.add('selected');
        }
    });
    selectedOption = index;
    document.getElementById('quizSubmit').disabled = false;
}

function checkAnswer() {
    if (selectedOption === null) return;

    const question = quizData[currentQuestion];
    const options = document.querySelectorAll('.quiz-option');
    const feedback = document.getElementById('quizFeedback');

    options.forEach((opt, i) => {
        if (i === question.correct) {
            opt.classList.add('correct');
        } else if (i === selectedOption) {
            opt.classList.add('incorrect');
        }
        opt.onclick = null;
    });

    if (selectedOption === question.correct) {
        score++;
        feedback.className = 'quiz-feedback correct';
        feedback.textContent = '✓ Correct! ' + question.explanation;
    } else {
        feedback.className = 'quiz-feedback incorrect';
        feedback.textContent = '✗ Incorrect. ' + question.explanation;
    }

    feedback.style.display = 'block';
    document.getElementById('quizSubmit').style.display = 'none';
    document.getElementById('quizNext').style.display = 'block';

    updateScore();
}

function nextQuestion() {
    currentQuestion++;
    if (currentQuestion < quizData.length) {
        loadQuestion();
    } else {
        showFinalScore();
    }
}

function updateScore() {
    const scoreElement = document.getElementById('quizScore');
    if (scoreElement) {
        scoreElement.textContent = `Score: ${score} / ${quizData.length}`;
    }
}

function showFinalScore() {
    const percentage = (score / quizData.length * 100).toFixed(0);
    let message = '';
    if (percentage >= 80) {
        message = 'Excellent! You really know your drone delivery facts!';
    } else if (percentage >= 60) {
        message = 'Good job! You have a solid understanding of drone delivery technology.';
    } else {
        message = 'Keep learning! Review the content above to learn more about drone delivery.';
    }

    document.getElementById('quizContainer').innerHTML = `
        <div style="text-align: center;">
            <h3>Quiz Complete!</h3>
            <div class="stat-number" style="color: var(--primary-color); margin: 2rem 0;">${score} / ${quizData.length}</div>
            <p style="font-size: 1.25rem; margin-bottom: 2rem;">${percentage}% Correct</p>
            <p style="font-size: 1.1rem; margin-bottom: 2rem;">${message}</p>
            <button class="quiz-button" onclick="resetQuiz()">Retake Quiz</button>
        </div>
    `;
}

function resetQuiz() {
    currentQuestion = 0;
    score = 0;
    document.getElementById('quizContainer').innerHTML = `
        <div class="quiz-question" id="quizQuestion"></div>
        <div class="quiz-options" id="quizOptions"></div>
        <button class="quiz-button" id="quizSubmit" onclick="checkAnswer()">Submit Answer</button>
        <button class="quiz-button" id="quizNext" onclick="nextQuestion()" style="display: none;">Next Question</button>
        <div class="quiz-feedback" id="quizFeedback" style="display: none;"></div>
        <div style="margin-top: 1rem; text-align: center;">
            <span id="quizScore"></span>
        </div>
    `;
    loadQuestion();
}

// Initialize quiz if on page with quiz
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('quizContainer')) {
        loadQuestion();
    }
});
