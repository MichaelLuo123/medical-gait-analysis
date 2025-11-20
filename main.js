const AVG_STEPS_PER_SEC = 1.5;
const WALK_DURATION_MS = 10000;
let bobDots = [];
let currentZoomData = [];
let currentSlide = 0;
let isRecording = false;
let journeyStage = 0;
const totalSlides = 8;
let journeyPlaying = false;
let controlStats = null;
const SCENARIO_PRESETS = {
    controlAges: {
        label: "Young vs Senior Control",
        description: "Contrasts stride consistency between 20-year-old and 69-year-old healthy participants.",
        person1: 1,
        person2: 3
    },
    alsStages: {
        label: "ALS Early vs Late",
        description: "Shows how stride timing deteriorates as ALS progresses from early to late stages.",
        person1: 4,
        person2: 6
    },
    parkinsonStages: {
        label: "Parkinson’s Early vs Late",
        description: "Highlights cadence changes between early and late Parkinson’s disease.",
        person1: 10,
        person2: 12
    },
    controlVsAls: {
        label: "Control vs ALS (Medium)",
        description: "Compares a healthy gait pattern with ALS medium-stage data for contrast.",
        person1: 1,
        person2: 5
    }
};

let currentFilteredBobData = [];
let currentFilteredPerson1Data = [];
let currentFilteredPerson2Data = [];

const SAMPLE_PEOPLE = [
    { id: 1, name: "Control", disease: "Healthy Control", file: "data/control.csv", color: "#28a745" },
    { id: 2, name: "ALS", disease: "ALS", file: "data/als.csv", color: "#dc3545" },
    { id: 3, name: "Huntington's", disease: "Huntington's Disease", file: "data/hunt.csv", color: "#6f42c1" },
    { id: 4, name: "Parkinson's", disease: "Parkinson's Disease", file: "data/park.csv", color: "#fd7e14" }
];

const EXPLORE_PEOPLE = [

    { id: 1, name: "Control (20 yrs)", file: "data/control_20.csv" },
    { id: 2, name: "Control (40 yrs)", file: "data/control_40.csv" },
    { id: 3, name: "Control (69 yrs)", file: "data/control_69.csv" },


    { id: 4, name: "ALS (Early)", file: "data/als_early.csv" },
    { id: 5, name: "ALS (Medium)", file: "data/als_medium.csv" },
    { id: 6, name: "ALS (Late)", file: "data/als_late.csv" },


    { id: 7, name: "Huntington's (Early)", file: "data/hunt_early.csv" },
    { id: 8, name: "Huntington's (Medium)", file: "data/hunt_medium.csv" },
    { id: 9, name: "Huntington's (Late)", file: "data/hunt_late.csv" },


    { id: 10, name: "Parkinson's (Early)", file: "data/park_early.csv" },
    { id: 11, name: "Parkinson's (Medium)", file: "data/park_medium.csv" },
    { id: 12, name: "Parkinson's (Late)", file: "data/park_late.csv" }
];


const DISEASE_DESCRIPTIONS = {
    "Control": {
        title: "Healthy Control",
        description: "Healthy individuals typically show consistent stride intervals with minimal variation. Their walking pattern serves as our reference point for identifying abnormal gait patterns."
    },
    "ALS": {
        title: "Amyotrophic Lateral Sclerosis (ALS)",
        description: "ALS affects motor neurons, leading to muscle weakness and progressive difficulty with movement. Gait patterns often show irregular stride intervals and reduced walking speed as the disease progresses."
    },
    "Huntington's": {
        title: "Huntington's Disease",
        description: "Huntington's disease causes involuntary movements and affects coordination. Walking patterns typically show irregular, jerky movements with highly variable stride intervals and difficulty maintaining steady pace."
    },
    "Parkinson's": {
        title: "Parkinson's Disease",
        description: "Parkinson's disease affects movement control, often causing shuffling gait, reduced stride length, and freezing episodes. Stride intervals may show patterns of hesitation or sudden changes in timing."
    }
};


let bobEl, startBtn, statusEl, svg, svg1, bobChartSvg, personSelect, replayBtn, legend, comparisonLabel, showLinesCheckbox;
let nextBtn1;
let nextButtons = [];
let slidesList = [];
let personSelectMulti1, personSelectMulti2;
let person1MultiEmoji, person2MultiEmoji, multiPlayBtn, multiLegend, person1LegendDot, person2LegendDot, person1LegendLabel, person2LegendLabel;
let slideProgressFill, slideProgressLabel;
let scenarioChips = [];
let scenarioDescriptionEl = null;


let lastBobPattern = null;

let timerInterval = null;

function updateTimer(timerElement, remainingTime) {
    const seconds = Math.ceil(remainingTime / 1000);
    timerElement.textContent = `${seconds}s`;
}

function startTimer(timerElement) {
    const startTime = Date.now();
    const duration = WALK_DURATION_MS;


    timerElement.style.display = 'block';
    updateTimer(timerElement, duration);


    if (timerInterval) {
        clearInterval(timerInterval);
    }


    timerInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, duration - elapsed);

        updateTimer(timerElement, remaining);


        if (remaining <= 0) {
            clearInterval(timerInterval);
            timerElement.style.display = 'none';
        }
    }, 100);
}


document.addEventListener('DOMContentLoaded', function() {
    bobEl = document.getElementById("bob");
    startBtn = document.getElementById("startBtn");
    statusEl = document.getElementById("status");
    svg = d3.select("#chart");
    svg1 = d3.select("#chart1");
    bobChartSvg = d3.select("#bobChartSvg");
    personSelect = document.getElementById("personSelect");
    replayBtn = document.getElementById("replayBtn");
    controlReplayBtn = document.getElementById("controlReplayBtn");
    legend = document.getElementById("legend");
    comparisonLabel = document.getElementById("comparisonLabel");
    showLinesCheckbox = document.getElementById("showLines");
    slidesList = Array.from(document.querySelectorAll(".slide"));
    nextButtons = slidesList
        .map(slide => slide.querySelector(".next-btn"))
        .filter(btn => btn);
    nextBtn1 = document.getElementById("nextBtn1");
    personSelectMulti1 = document.getElementById("personSelectMulti1");
    personSelectMulti2 = document.getElementById("personSelectMulti2");
    person1MultiEmoji = document.getElementById("person1MultiEmoji");
    person2MultiEmoji = document.getElementById("person2MultiEmoji");
    multiPlayBtn = document.getElementById("multiPlayBtn");
    multiLegend = document.getElementById("multiLegend");
    person1LegendDot = document.getElementById("person1LegendDot");
    person2LegendDot = document.getElementById("person2LegendDot");
    person1LegendLabel = document.getElementById("person1LegendLabel");
    person2LegendLabel = document.getElementById("person2LegendLabel");
    slideProgressFill = document.getElementById("slideProgressFill");
    slideProgressLabel = document.getElementById("slideProgressLabel");
    scenarioChips = Array.from(document.querySelectorAll(".scenario-chip"));
    scenarioDescriptionEl = document.getElementById("scenarioDescription");

    initializeApp();
    updateSlideProgress();
});

function initializeApp() {

    SAMPLE_PEOPLE.forEach(p => {
        const option = document.createElement("option");
        option.value = p.id;
        option.textContent = `${p.name} (${p.disease})`;
        personSelect.appendChild(option);
    });


    EXPLORE_PEOPLE.forEach(p => {
        const option = document.createElement("option");
        option.value = p.id;
        option.textContent = p.name;
        personSelectMulti1.appendChild(option);
    });


    EXPLORE_PEOPLE.forEach(p => {
        const option = document.createElement("option");
        option.value = p.id;
        option.textContent = p.name;
        personSelectMulti2.appendChild(option);
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowRight') {
            nextSlide();
        } else if (e.key === 'ArrowLeft') {
            prevSlide();
        } else if (e.key === 'Home') {
            goToSlide(0);
        } else if (e.key === 'End') {
            goToSlide(totalSlides - 1);
        }
    });
    showControlPattern();
    setupEventListeners();
    updateSlideIndicators();
}
function showDiseaseDescription(personName, isPlayground = false) {
    const description = DISEASE_DESCRIPTIONS[personName];
    if (!description) return;

    const descriptionDiv = document.getElementById('diseaseDescription');
    const titleElement = document.getElementById('diseaseTitle');
    const textElement = document.getElementById('diseaseText');

    if (descriptionDiv && titleElement && textElement) {
        titleElement.textContent = description.title;
        textElement.textContent = description.description;
        descriptionDiv.style.display = 'block';
    }
}

function hideDiseaseDescription(isPlayground = false) {
    const descriptionDiv = document.getElementById('diseaseDescription');
    if (descriptionDiv) {
        descriptionDiv.style.display = 'none';
    }
}

function setupEventListeners() {

    bobEl.addEventListener("click", (e) => {
        e.preventDefault();
        takeStep(bobEl);


        if (isRecording && startTime) {
            const now = performance.now();
            const elapsed = now - startTime;
            if (elapsed <= WALK_DURATION_MS) {
                bobSteps.push(elapsed);
                console.log(`Step recorded at ${elapsed}ms`);
            }
        }
    });

    if (startBtn) {
        startBtn.addEventListener("click", startWalk);
    }
    if (scenarioChips.length > 0) {
        scenarioChips.forEach(chip => {
            chip.addEventListener("click", () => {
                const key = chip.dataset.preset;
                applyScenarioPreset(key, chip);
            });
        });
    }
    replayBtn.addEventListener("click", replaySteps);
    controlReplayBtn.addEventListener("click", async () => {
        console.log("Control replay clicked");

        const svgZoom = d3.select('#zoomChart1');
        const timer2 = document.getElementById("timer2");

        controlReplayBtn.disabled = true;
        controlReplayBtn.textContent = "Replaying...";

        if (timer2) startTimer(timer2);

        await replayZoomSteps(currentZoomData, svgZoom, document.getElementById("controlCharacter"));

        controlReplayBtn.disabled = false;
        controlReplayBtn.textContent = "Play Control Walk";

        if (timer2) timer2.style.display = 'none';
    });
    diseaseReplayBtn.addEventListener("click", async () => {
        console.log("Control replay clicked");

        const svgZoom = d3.select('#zoomChart2');
        const timer3 = document.getElementById("timer3");

        diseaseReplayBtn.disabled = true;
        diseaseReplayBtn.textContent = "Replaying...";

        if (timer3) startTimer(timer3);

        await replayZoomSteps(currentZoomData, svgZoom, document.getElementById("diseaseCharacter"));

        diseaseReplayBtn.disabled = false;
        diseaseReplayBtn.textContent = "Play Walk";

        if (timer3) timer3.style.display = 'none';
    });
    if (nextButtons.length > 0 && slidesList.length > 0) {
        nextButtons.forEach(btn => {
            const parentSlide = btn.closest('.slide');
            const parentIndex = slidesList.indexOf(parentSlide);
            btn.addEventListener('click', () => {
                const targetIndex = Math.min(parentIndex + 1, slidesList.length - 1);
                if (targetIndex !== parentIndex) {
                    goToSlide(targetIndex);
                }
            });
        });
    }

    personSelect.addEventListener("change", async () => {
        const selectedId = personSelect.value;
        if (selectedId) {
            currentComparison = SAMPLE_PEOPLE.find(p => p.id == selectedId);
            console.log('Selected comparison:', currentComparison);
            showDiseaseDescription(currentComparison.name);
        } else {
            currentComparison = null;
            legend.style.display = "none";
            hideDiseaseDescription();
            updateInsightCard(controlStats, null, SAMPLE_PEOPLE[0].name);
            return;
        }
        console.log('Person select changed:', selectedId);
        const selectPerson = SAMPLE_PEOPLE[selectedId - 1];
        console.log('Selected person:', selectPerson);
        const selectIntervals = await loadCSVData(selectPerson);
        const stats = computeGaitStats(selectIntervals);
        updateInsightCard(stats, controlStats, selectPerson.name);

        drawLongChart(selectIntervals, selectPerson, d3.select('#chart2'), d3.select('#zoomChart2'));
        drawZoomChart(selectIntervals, selectPerson, d3.select('#zoomChart2'), 0);
    });


    personSelectMulti1.addEventListener("change", updateMultiCharts);
    personSelectMulti2.addEventListener("change", updateMultiCharts);
    multiPlayBtn.addEventListener("click", playMultiWalk);


    document.querySelectorAll('.dot').forEach((dot, index) => {
        dot.addEventListener('click', () => goToSlide(index));
    });


    document.querySelectorAll('.prev-btn').forEach((btn, index) => {
        btn.addEventListener('click', () => {
            if (currentSlide > 0) {
                goToSlide(currentSlide - 1);
            }
        });
    });
}

function showSlide(n) {
    const slides = document.querySelectorAll('.slide');


    slides.forEach(slide => {
        slide.classList.remove('active', 'prev');
    });


    if (n < slides.length) {
        slides[n].classList.add('active');


        for (let i = 0; i < n; i++) {
            slides[i].classList.add('prev');
        }
    }

    updateSlideIndicators();
}

function updateSlideIndicators() {
    const dots = document.querySelectorAll('.dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
    });
    updateSlideProgress();
}

function goToSlide(n) {
    const slidesCount = slidesList.length > 0 ? slidesList.length : totalSlides;
    const numericTarget = Number.isFinite(Number(n)) ? Number(n) : currentSlide;
    const target = Math.max(0, Math.min(slidesCount - 1, numericTarget));
    currentSlide = target;
    showSlide(currentSlide);
}

function updateSlideProgress() {
    if (slideProgressFill) {
        const percentage = totalSlides > 1 ? (currentSlide / (totalSlides - 1)) * 100 : 0;
        slideProgressFill.style.width = `${percentage}%`;
    }
    if (slideProgressLabel) {
        slideProgressLabel.textContent = `Slide ${currentSlide + 1} of ${totalSlides}`;
    }
}

let bobSteps = [], startTime = null, intervalId = null;
let loadedData = {};

function reset() {
    bobSteps = [];
    currentFilteredBobData = [];
    currentFilteredPerson1Data = [];
    currentFilteredPerson2Data = [];
    startTime = null;
    isRecording = false;
    footStateApart = false;
    smoothedSeparationRatio = null;
    svg.selectAll("*").remove();
    bobChartSvg.selectAll("*").remove();
    statusEl.textContent = "";
    replayBtn.style.display = "none";

    document.getElementById("bobChart").style.display = "none";
    bobEl.style.transform = "translateX(0px)";
    if (nextBtn1) nextBtn1.disabled = true;
    if (startBtn) {
        startBtn.disabled = false;
        startBtn.textContent = "Start Recording";
    }


    const timer1 = document.getElementById('timer1');
    const timer4 = document.getElementById('timer4');
    if (timer1) timer1.style.display = 'none';
    if (timer4) timer4.style.display = 'none';
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    if (personSelectMulti1) personSelectMulti1.value = "";
    if (personSelectMulti2) personSelectMulti2.value = "";
    d3.select("#multiChart1").selectAll("*").remove();
    d3.select("#multiChart2").selectAll("*").remove();
    d3.select("#multiZoomChart").selectAll("*").remove();
    multiLegend.style.display = "none";
    multiPlayBtn.disabled = true;
}


async function loadCSVData(person) {
    if (loadedData[person.file]) {
        return loadedData[person.file];
    }

    try {
        console.log(`Loading data from: ${person.file}`);
        const data = await d3.csv(person.file, d => ({
            time: +d.time,
            interval: +d.interval
        }));
        console.log(`Loaded ${data.length} rows from ${person.file}`);
        loadedData[person.file] = data;
        return data;
    } catch (error) {
        console.error(`Error loading ${person.file}:`, error);
        statusEl.textContent = `Error loading ${person.name} data. Check console for details.`;
        return [];
    }
}

function computeGaitStats(data) {
    if (!data || data.length === 0) return null;
    const intervals = data
        .map(d => d.interval)
        .filter(value => Number.isFinite(value) && value > 0);
    if (intervals.length === 0) return null;

    const sum = intervals.reduce((acc, val) => acc + val, 0);
    const mean = sum / intervals.length;
    const variance = intervals.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / intervals.length;
    const std = Math.sqrt(variance);
    const cadence = mean ? 60 / mean : null;
    const variability = mean ? std / mean : null;
    const min = Math.min(...intervals);
    const max = Math.max(...intervals);

    return {
        mean,
        std,
        cadence,
        variability,
        min,
        max,
        sampleSize: intervals.length
    };
}

function formatStat(value, suffix = '') {
    if (value == null || Number.isNaN(value)) return '--';
    return `${value}${suffix}`;
}

function updateInsightCard(stats, baseline, label) {
    const card = document.getElementById('insightCard');
    if (!card) return;
    if (!stats) {
        card.style.display = 'none';
        return;
    }

    const avgEl = document.getElementById('insightAvg');
    const cadenceEl = document.getElementById('insightCadence');
    const variabilityEl = document.getElementById('insightVariability');
    const deltaGroup = document.getElementById('insightDeltaGroup');
    const deltaEl = document.getElementById('insightDelta');
    const titleEl = document.getElementById('insightTitle');
    const subtitleEl = document.getElementById('insightSubtitle');

    card.style.display = 'grid';
    if (titleEl) titleEl.textContent = label ? `${label} Snapshot` : 'Gait Snapshot';
    if (subtitleEl) subtitleEl.textContent = stats.sampleSize ? `Based on ${stats.sampleSize} strides` : 'Live metrics';

    if (avgEl) avgEl.textContent = stats.mean ? `${stats.mean.toFixed(2)} s` : '--';
    if (cadenceEl) cadenceEl.textContent = stats.cadence ? `${stats.cadence.toFixed(1)} bpm` : '--';
    if (variabilityEl) variabilityEl.textContent = stats.variability ? `${(stats.variability * 100).toFixed(1)} %` : '--';

    if (deltaGroup && deltaEl) {
        if (baseline && stats !== baseline) {
            const cadenceDelta = (stats.cadence ?? 0) - (baseline.cadence ?? 0);
            const variabilityDelta = (stats.variability ?? 0) - (baseline.variability ?? 0);
            const cadenceText = Number.isFinite(cadenceDelta) ? `${cadenceDelta >= 0 ? '+' : ''}${cadenceDelta.toFixed(1)} bpm cadence` : '';
            const variabilityText = Number.isFinite(variabilityDelta) ? `${variabilityDelta >= 0 ? '+' : ''}${(variabilityDelta * 100).toFixed(1)}% variability` : '';
            const combined = [cadenceText, variabilityText].filter(Boolean).join(' | ');
            deltaEl.textContent = combined || '--';
            deltaGroup.style.display = combined ? 'flex' : 'none';
        } else {
            deltaGroup.style.display = 'none';
        }
    }
}


function processStepsToData(steps) {
    if (steps.length < 2) {

        return [];
    }

    const stepData = [];


    for (let i = 1; i < steps.length; i++) {
        const currentStepTime = steps[i] / 1000;
        const previousStepTime = steps[i - 1] / 1000;
        const strideInterval = currentStepTime - previousStepTime;


        stepData.push({
            time: currentStepTime,
            interval: strideInterval,
            type: 'stride'
        });
    }

    console.log('Processed Bob stride intervals:', stepData);
    return stepData;
}

async function showControlPattern() {
    const controlPerson = SAMPLE_PEOPLE[0];
    console.log('Showing control pattern for:', controlPerson);
    const controlIntervals = await loadCSVData(controlPerson);
    controlStats = computeGaitStats(controlIntervals);
    updateInsightCard(controlStats, null, controlPerson.name);
    const controlChart = document.getElementById('controlChart');
    controlChart.style.display = 'block';
    if (nextBtn2) nextBtn2.style.display = 'inline-block';

    drawLongChart(controlIntervals, controlPerson, svg1, d3.select('#zoomChart1'));
    drawZoomChart(controlIntervals, controlPerson, d3.select('#zoomChart1'), 0);
}

function drawLongChart(data, person, svg, zoomSvg, includeBrush = true, customBrushCallback = null) {
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 40, bottom: 60, left: 80 },
        width = 800 - margin.left - margin.right,
        height = 200 - margin.top - margin.bottom;

    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.time)])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, Math.max(2, d3.max(data, d => d.interval))])
        .range([height, 0]);

    const chart = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);


    chart.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .append("text")
        .attr("x", width / 2)
        .attr("y", 40)
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Time (seconds)");


    chart.append("g")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -50)
        .attr("x", -height / 2)
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Stride Interval (s)");


    chart.selectAll(".data-dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "data-dot")
        .attr("cx", d => x(d.time))
        .attr("cy", d => y(d.interval))
        .attr("r", 6)
        .attr("fill", person.color)
        .attr("opacity", 0.8)
        .attr("stroke", "white")
        .attr("stroke-width", 2);


    if (includeBrush) {
        const brush = d3.brushX()
            .extent([[0, 0], [width, height]])
            .on("brush end", ({ selection }) => {
                if (!selection) return;
                const [x0, x1] = selection.map(x.invert);

                if (customBrushCallback) {

                    customBrushCallback(x0, x1);
                } else {

                    drawZoomChart(
                        data.filter(d => d.time >= x0 && d.time <= x1),
                        person,
                        zoomSvg,
                        x0
                    );
                    currentZoomData = data.filter(d => d.time >= x0 && d.time <= x1);
                }
            });

        chart.append("g")
            .attr("class", "brush")
            .call(brush)
            .call(brush.move, [0, 10].map(x));
    }
}

function drawZoomChart(intervals, person, svg, startTime = 0, comparisonData = null, comparisonPerson = null) {
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 40, bottom: 60, left: 80 },
        width = 800 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;


    const endTime = startTime + 10;
    const zoomedData = intervals.filter(d => d.time >= startTime && d.time <= endTime);
    currentZoomData = zoomedData.map(d => ({
        ...d,
        time: d.time - startTime
    }));
    console.log('Zoomed data:', currentZoomData);

    const x = d3.scaleLinear()
        .domain([startTime, endTime])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([
            0,
            Math.max(2, d3.max(zoomedData, d => d.interval) * 1.1)
        ])
        .range([height, 0]);

    const chart = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);


    chart.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .append("text")
        .attr("x", width / 2)
        .attr("y", 40)
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text('Time (seconds)');


    chart.append("g")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -50)
        .attr("x", -height / 2)
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Stride Interval (s)");


    chart.selectAll(".zoom-dot")
        .data(zoomedData)
        .enter()
        .append("circle")
        .attr("class", "zoom-dot")
        .attr("cx", d => x(d.time))
        .attr("cy", d => y(d.interval))
        .attr("r", 6)
        .attr("fill", person.color)
        .attr("opacity", 0.8)
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .attr("data-original-fill", person.color);


    if (comparisonData && comparisonPerson) {
        chart.selectAll(".comparison-dot")
            .data(comparisonData)
            .enter()
            .append("circle")
            .attr("class", "comparison-dot")
            .attr("cx", d => x(d.time))
            .attr("cy", d => y(d.interval))
            .attr("r", 6)
            .attr("fill", comparisonPerson.color)
            .attr("opacity", 0.8)
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .attr("data-original-fill", comparisonPerson.color);
    }
}

function replayZoomSteps(zoomData, svgZoom, char) {
    const dots = svgZoom.selectAll(".zoom-dot");
    const controlChar = char;
    if (zoomData.length === 0 || dots.empty() || !controlChar) return;

    const sortedData = [...zoomData].sort((a, b) => a.time - b.time);
    const baseTime = sortedData[0].time;

    let stepRight = true;
    const stepDistance = 20;

    sortedData.forEach((step, i) => {
        const delay = (step.time - baseTime) * 1000;
        setTimeout(() => {

            const dot = d3.select(dots.nodes()[i]);

            if (!dot.empty()) {
                const originalFill = dot.attr("data-original-fill");

                dot.transition()
                    .duration(300)
                    .attr("r", 10)
                    .attr("fill", "#ff6b6b")
                    .attr("opacity", 1)
                    .transition()
                    .duration(300)
                    .attr("r", 6)
                    .attr("fill", originalFill)
                    .attr("opacity", 0.8);
            }
            takeStep(controlChar);


        }, delay);
    });

    const totalTime = (sortedData[sortedData.length - 1].time - baseTime) * 1000 + 500;
    return new Promise(resolve => setTimeout(resolve, totalTime));
}



function drawBobChart(stepData) {
    bobChartSvg.selectAll("*").remove();

    const margin = { top: 20, right: 40, bottom: 60, left: 80 },
        width = 800 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    const x = d3.scaleLinear()
        .domain([0, 10])
        .range([0, width]);


    const maxInterval = stepData.length > 0 ? d3.max(stepData, d => d.interval) : 2;
    const y = d3.scaleLinear()
        .domain([0, Math.max(2, maxInterval * 1.1)])
        .range([height, 0]);

    const chart = bobChartSvg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);


    const xGrid = d3.axisBottom(x).tickSize(-height).tickFormat("");
    const yGrid = d3.axisLeft(y).tickSize(-width).tickFormat("");

    chart.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0,${height})`)
        .call(xGrid)
        .style("stroke-dasharray", "3,3")
        .style("opacity", 0.3);

    chart.append("g")
        .attr("class", "grid")
        .call(yGrid)
        .style("stroke-dasharray", "3,3")
        .style("opacity", 0.3);


    chart.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickSize(8))
        .style("font-size", "14px")
        .append("text")
        .attr("x", width / 2)
        .attr("y", 40)
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "600")
        .text("Time (seconds)");

    chart.append("g")
        .call(d3.axisLeft(y))
        .style("font-size", "14px")
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -50)
        .attr("x", -height / 2)
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "600")
        .text("Stride Interval (seconds)");


    if (stepData.length > 0) {
        const dots = chart.selectAll(".bob-dot")
            .data(stepData)
            .enter()
            .append("circle")
            .attr("class", "bob-dot")
            .attr("cx", d => x(d.time))
            .attr("cy", d => y(d.interval))
            .attr("r", 8)
            .attr("fill", "#007acc")
            .attr("opacity", 0.8)
            .attr("stroke", "white")
            .attr("stroke-width", 3);


        bobDots = dots;

        chart.append("path")
            .datum(stepData)
            .attr("fill", "none")
            .attr("stroke", "#007acc")
            .attr("stroke-width", 2)
            .attr("opacity", 0.5)
    } else {

        chart.append("text")
            .attr("x", width / 2)
            .attr("y", height / 2)
            .attr("text-anchor", "middle")
            .attr("fill", "#666")
            .style("font-size", "16px")
            .text("Need at least 2 steps to calculate stride intervals");
    }
}

async function drawChart(showLines = false) {

    const svg = d3.select('#bobChartSvg');
    svg.selectAll("*").remove();

    const bobStepData = processStepsToData(bobSteps);

    if (bobStepData.length === 0) {
        console.warn('No data to display in chart');
        return;
    }


    const svgElement = svg.node();
    const svgRect = svgElement.getBoundingClientRect();

    const width = svgRect.width || 800;
    const height = svgRect.height || 400;
    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;


    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const x = d3.scaleLinear()
        .domain([0, 10])
        .range([0, innerWidth]);

    const y = d3.scaleLinear()
        .domain([0, Math.max(2, d3.max(bobStepData, d => d.interval))])
        .range([innerHeight, 0]);

    const chart = svg.append("g")
        .attr("transform", `translate(<span class="math-inline">\{margin\.left\},</span>{margin.top})`);


    const xGrid = d3.axisBottom(x).tickSize(-innerHeight).tickFormat("");
    const yGrid = d3.axisLeft(y).tickSize(-innerWidth).tickFormat("");

    chart.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(xGrid)
        .style("stroke-dasharray", "3,3")
        .style("opacity", 0.3);

    chart.append("g")
        .attr("class", "grid")
        .call(yGrid)
        .style("stroke-dasharray", "3,3")
        .style("opacity", 0.3);


    chart.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x).tickSize(8))
        .style("font-size", "12px")
        .append("text")
        .attr("x", innerWidth / 2)
        .attr("y", 40)
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "600")
        .text("Time (seconds)");

    chart.append("g")
        .call(d3.axisLeft(y).tickSize(8))
        .style("font-size", "12px")
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -45)
        .attr("x", -innerHeight / 2)
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "600")
        .text("Stride Interval (seconds)");


    if (bobStepData.length > 0) {

        if (showLines) {
            const bobLine = d3.line()
                .x(d => x(d.time))
                .y(d => y(d.interval))
                .curve(d3.curveMonotoneX);

            chart.append("path")
                .datum(bobStepData)
                .attr("class", "bob-line")
                .attr("fill", "none")
                .attr("stroke", "#007acc")
                .attr("stroke-width", 2)
                .attr("opacity", 0.5)
                .attr("d", bobLine);
        }

        bobDots = chart.selectAll(".bob-dot")
            .data(bobStepData)
            .enter()
            .append("circle")
            .attr("class", "bob-dot")
            .attr("cx", d => x(d.time))
            .attr("cy", d => y(d.interval))
            .attr("r", 6)
            .attr("fill", "#007acc")
            .attr("opacity", 0.8)
            .attr("stroke", "white")
            .attr("stroke-width", 2);
    }
}

function startWalk() {
    reset();
    isRecording = true;
    startTime = performance.now();
    if (startBtn) {
        startBtn.disabled = true;
        startBtn.textContent = "Recording...";
    }
    statusEl.textContent = "Click the character to record steps for 10 seconds";


    const timer = currentSlide === 0 ?
        document.getElementById('timer1') :
        document.getElementById('timer4');
    if (timer) {
        startTimer(timer);
    }

    console.log('Recording started at:', startTime);

    setTimeout(() => {
        isRecording = false;
        statusEl.textContent = `Recording complete. ${bobSteps.length} steps recorded.`;
        console.log('Recording ended. Total steps:', bobSteps.length);
        console.log('Step times:', bobSteps);

        if (bobSteps.length > 0) {

            const bobStepData = processStepsToData(bobSteps);


            if (document.getElementById("bobChart")) {
                drawBobChart(bobStepData);
                document.getElementById("bobChart").style.display = "block";
            }


            replayBtn.style.display = "inline-block";
            if (nextBtn1) nextBtn1.disabled = false;

            if (startBtn) {
                startBtn.textContent = "Record Again";
                startBtn.disabled = false;
            }
        } else {
            statusEl.textContent = "No steps recorded. Try clicking during the recording period.";
            if (startBtn) {
                startBtn.disabled = false;
                startBtn.textContent = "Start Recording";
            }
        }

        document.getElementById("nextBtn1").textContent = "Continue";
    }, WALK_DURATION_MS);
}

let stepRight = true;

function takeStep(element) {
    const distance = stepRight ? 20 : -20;
    element.style.transform = `translateX(${distance}px)`;
    stepRight = !stepRight;

    element.style.transition = "transform 0.2s ease";
    setTimeout(() => {
        element.style.transition = "transform 0.3s ease";
    }, 200);
}

function replaySteps() {
    if (bobSteps.length === 0) return;

    replayBtn.disabled = true;
    replayBtn.textContent = "Replaying...";

    bobEl.style.transform = "translateX(0px)";
    stepRight = true;


    const currentSlideChart = currentSlide === 0 ?
        d3.select('#bobChartSvg').selectAll(".bob-dot") :
        d3.select('#playgroundChart').selectAll(".bob-dot");

    bobSteps.forEach((stepTime, i) => {
        setTimeout(() => {
            takeStep(bobEl);


            const animateDot = (dot) => {
                if (dot.empty()) return;

                dot.transition()
                    .duration(300)
                    .attr("r", 12)
                    .attr("fill", "#ff6b6b")
                    .attr("opacity", 1)
                    .transition()
                    .duration(300)
                    .attr("r", 6)
                    .attr("fill", "#007acc")
                    .attr("opacity", 0.8);
            };


            if (currentSlideChart && currentSlideChart.nodes() && currentSlideChart.nodes()[i]) {
                animateDot(d3.select(currentSlideChart.nodes()[i]));
            }
        }, stepTime);
    });

    const totalTime = bobSteps[bobSteps.length - 1] || 0;
    setTimeout(() => {
        replayBtn.disabled = false;
        replayBtn.textContent = "Replay Walk";
    }, totalTime + 1000);
}

function drawZoomComparisonChart(bob, disease, svg, startTime = 0) {
    svg.selectAll("*").remove();
    const margin = { top: 20, right: 40, bottom: 60, left: 80 },
        width = 800 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    const endTime = startTime + 10;
    const bobZoom = bob.filter(d => d.time >= startTime && d.time <= endTime);
    const diseaseZoom = disease.filter(d => d.time >= startTime && d.time <= endTime);
    console.log('diseaseZoom:', diseaseZoom);

    const x = d3.scaleLinear().domain([startTime, endTime]).range([0, width]);
    const y = d3.scaleLinear().domain([0, 2]).range([height, 0]);

    const chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    chart.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
    chart.append("g").call(d3.axisLeft(y));

    chart.selectAll(".bob-dot")
        .data(bobZoom)
        .enter().append("circle")
        .attr("class", "bob-dot")
        .attr("cx", d => x(d.time))
        .attr("cy", d => y(d.interval))
        .attr("r", 6)
        .attr("fill", "#007acc")
        .attr("opacity", 0.8);

    chart.selectAll(".disease-dot")
        .data(diseaseZoom)
        .enter().append("circle")
        .attr("class", "disease-dot")
        .attr("cx", d => x(d.time))
        .attr("cy", d => y(d.interval))
        .attr("r", 6)
        .attr("fill", "#dc3545")
        .attr("opacity", 0.8);
}

function playVsWalk() {
    const [bobZoom, diseaseZoom] = currentZoomData || [];
    if (!bobZoom || !diseaseZoom) return;

    const bobChar = document.getElementById("bobVsEmoji");
    const disChar = document.getElementById("diseaseVsEmoji");
    const timer3 = document.getElementById("timer3");

    stepRight = true;
    bobChar.style.transform = "translateX(0px)";
    disChar.style.transform = "translateX(0px)";
    if (timer3) startTimer(timer3);

    const allSteps = [...bobZoom, ...diseaseZoom];
    const maxTime = d3.max(allSteps, d => d.time);
    const baseTime = d3.min(allSteps, d => d.time);

    bobZoom.forEach((step, i) => {
        const delay = (step.time - baseTime) * 1000;
        setTimeout(() => takeStep(bobChar), delay);
    });

    diseaseZoom.forEach((step, i) => {
        const delay = (step.time - baseTime) * 1000;
        setTimeout(() => takeStep(disChar), delay);
    });

    setTimeout(() => {
        if (timer3) timer3.style.display = "none";
    }, (maxTime - baseTime) * 1000 + 1000);
}
function nextSlide() {
    if (currentSlide < totalSlides - 1) {
        currentSlide++;
        showSlide(currentSlide);
    }
}

function prevSlide() {
    if (currentSlide > 0) {
        currentSlide--;
        showSlide(currentSlide);
    }
}

function restartPresentation() {
    currentSlide = 0;
    showSlide(currentSlide);
    resetJourney();
}
function showApplication(type, event) {
    const applications = {
        'detection': {
            title: 'Early Disease Detection',
            description: 'Gait changes can appear years before traditional symptoms. Analysis of walking patterns can help identify neurological conditions in early stages.',
            icon: ''
        },
        'monitoring': {
            title: 'Treatment Monitoring',
            description: 'Gait data provides objective measurements of treatment effectiveness. Doctors can adjust medications based on walking pattern changes.',
            icon: ''
        },
        'prevention': {
            title: 'Fall Prevention',
            description: 'Gait instability patterns can help predict fall risk. Preventive interventions can be implemented before accidents occur.',
            icon: ''
        }
    };

    const app = applications[type];
    if (app) {

        document.querySelectorAll('.impact-card').forEach(card => {
            card.style.transform = 'scale(0.95)';
            card.style.opacity = '0.7';
        });


        if (event && event.target) {
            const targetCard = event.target.closest('.impact-card');
            if (targetCard) {
                targetCard.style.transform = 'scale(1.05)';
                targetCard.style.opacity = '1';
            }
        }

        setTimeout(() => {
            document.querySelectorAll('.impact-card').forEach(card => {
                card.style.transform = 'scale(1)';
                card.style.opacity = '1';
            });
        }, 1000);
    }
}
function playJourney() {
    if (journeyPlaying) return;

    journeyPlaying = true;
    const playBtn = document.getElementById('playBtn');
    playBtn.disabled = true;
    playBtn.textContent = 'Playing...';

    resetJourney();
    animateJourney();
}

function resetJourney() {
    journeyStage = 0;
    journeyPlaying = false;
    const items = document.querySelectorAll('.timeline-item');
    items.forEach(item => {
        item.classList.remove('active');
    });

    const playBtn = document.getElementById('playBtn');
    playBtn.disabled = false;
    playBtn.textContent = 'Play Journey';
}

function animateJourney() {
    if (journeyStage >= 5) {

        setTimeout(() => {
            resetJourney();
        }, 2000);
        return;
    }


    const currentItem = document.querySelector(`[data-stage="${journeyStage}"]`);
    if (currentItem) {
        currentItem.classList.add('active');
    }

    journeyStage++;


    setTimeout(() => {
        animateJourney();
    }, 1500);
}


async function updateMultiCharts() {
    const selectedId1 = personSelectMulti1.value;
    const selectedId2 = personSelectMulti2.value;

    const bobData = processStepsToData(bobSteps);

    let person1 = null;
    let person2 = null;
    let data1 = [];
    let data2 = [];


    d3.select("#multiChart1").selectAll("*").remove();
    d3.select("#multiChart2").selectAll("*").remove();
    d3.select("#multiZoomChart").selectAll("*").remove();
    multiLegend.style.display = "none";
    multiPlayBtn.disabled = true;


    const person1FixedColor = { color: "#6f42c1" };
    const person2FixedColor = { color: "#fd7e14" };


    if (selectedId1) {
        person1 = EXPLORE_PEOPLE.find((p) => p.id == selectedId1);
        data1 = await loadCSVData(person1);
    }


    if (selectedId2) {
        person2 = EXPLORE_PEOPLE.find((p) => p.id == selectedId2);
        data2 = await loadCSVData(person2);
    }



    currentFilteredBobData = bobData
        .filter((d) => d.time >= 0 && d.time <= 10)
        .map((d) => ({ ...d, time: d.time - 0 }));

    if (person1 && data1.length > 0) {
        currentFilteredPerson1Data = data1
            .filter((d) => d.time >= 0 && d.time <= 10)
            .map((d) => ({ ...d, time: d.time - 0 }));
    } else {
        currentFilteredPerson1Data = [];
    }

    if (person2 && data2.length > 0) {
        currentFilteredPerson2Data = data2
            .filter((d) => d.time >= 0 && d.time <= 10)
            .map((d) => ({ ...d, time: d.time - 0 }));
    } else {
        currentFilteredPerson2Data = [];
    }



    const person1BrushCallback = (x0, x1) => {
        currentFilteredPerson1Data = data1
            .filter((d) => d.time >= x0 && d.time <= x1)
            .map((d) => ({ ...d, time: d.time - x0 }));


        const maxOverallTime = Math.max(
            d3.max(currentFilteredBobData, (d) => d.time) || 0,
            d3.max(currentFilteredPerson1Data, (d) => d.time) || 0,
            d3.max(currentFilteredPerson2Data, (d) => d.time) || 0
        );


        drawMultiZoomChart(
            currentFilteredBobData, {name: "Bob", color: "#007acc"},
            currentFilteredPerson1Data, person1,
            currentFilteredPerson2Data, person2,
            maxOverallTime
        );

        currentZoomData = {
            bob: currentFilteredBobData,
            person1: currentFilteredPerson1Data,
            person2: currentFilteredPerson2Data,
        };
    };



    const person2BrushCallback = (x0, x1) => {
        currentFilteredPerson2Data = data2
            .filter((d) => d.time >= x0 && d.time <= x1)
            .map((d) => ({ ...d, time: d.time - x0 }));


        const maxOverallTime = Math.max(
            d3.max(currentFilteredBobData, (d) => d.time) || 0,
            d3.max(currentFilteredPerson1Data, (d) => d.time) || 0,
            d3.max(currentFilteredPerson2Data, (d) => d.time) || 0
        );


        drawMultiZoomChart(
            currentFilteredBobData, {name: "Bob", color: "#007acc"},
            currentFilteredPerson1Data, person1,
            currentFilteredPerson2Data, person2,
            maxOverallTime
        );

        currentZoomData = {
            bob: currentFilteredBobData,
            person1: currentFilteredPerson1Data,
            person2: currentFilteredPerson2Data,
        };
    };


    if (selectedId1) {
        drawLongChart(data1, { ...person1, color: person1FixedColor.color }, d3.select("#multiChart1"), d3.select("#multiZoomChart"), true, person1BrushCallback);
    }
    if (selectedId2) {
        drawLongChart(data2, { ...person2, color: person2FixedColor.color }, d3.select("#multiChart2"), d3.select("#multiZoomChart"), true, person2BrushCallback);
    }



    if (bobData.length > 0 && (selectedId1 || selectedId2)) {
        const maxOverallTime = Math.max(
            d3.max(currentFilteredBobData, (d) => d.time) || 0,
            d3.max(currentFilteredPerson1Data, (d) => d.time) || 0,
            d3.max(currentFilteredPerson2Data, (d) => d.time) || 0
        );
        drawMultiZoomChart(
            currentFilteredBobData,
            { name: "Bob", color: "#007acc" },
            currentFilteredPerson1Data,
            person1,
            currentFilteredPerson2Data,
            person2,
            maxOverallTime
        );
        multiLegend.style.display = "flex";
        multiPlayBtn.disabled = false;
        updateMultiLegend(person1, person2);

        currentZoomData = {
            bob: currentFilteredBobData,
            person1: currentFilteredPerson1Data,
            person2: currentFilteredPerson2Data,
        };
    } else {
        multiLegend.style.display = "none";
        multiPlayBtn.disabled = true;
    }
}

function updateMultiLegend(person1, person2) {
    if (person1) {
        person1LegendDot.style.backgroundColor = "#6f42c1";
        person1LegendLabel.textContent = person1.name;
    } else {
        person1LegendDot.style.backgroundColor = "transparent";
        person1LegendLabel.textContent = "Person 1";
    }

    if (person2) {
        person2LegendDot.style.backgroundColor = "#fd7e14";
        person2LegendLabel.textContent = person2.name;
    } else {
        person2LegendDot.style.backgroundColor = "transparent";
        person2LegendLabel.textContent = "Person 2";
    }
}

function applyScenarioPreset(presetKey, activeChip = null) {
    const preset = SCENARIO_PRESETS[presetKey];
    if (!preset) return;

    if (personSelectMulti1) {
        personSelectMulti1.value = preset.person1 ? String(preset.person1) : "";
    }
    if (personSelectMulti2) {
        personSelectMulti2.value = preset.person2 ? String(preset.person2) : "";
    }

    if (scenarioDescriptionEl) {
        scenarioDescriptionEl.textContent = preset.description || "";
    }

    if (activeChip) {
        scenarioChips.forEach(chip => chip.classList.toggle('active', chip === activeChip));
    }

    updateMultiCharts();
}


function drawMultiZoomChart(bobData, bobPerson, person1Data, person1Person, person2Data, person2Person, maxTime) {
    const svg = d3.select("#multiZoomChart");
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 40, bottom: 60, left: 80 },
        width = 800 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    const x = d3.scaleLinear()
        .domain([0, 10])
        .range([0, width]);

    const allIntervals = [
        ...(bobData.length > 0 ? bobData.map(d => d.interval) : []),
        ...(person1Data.length > 0 ? person1Data.map(d => d.interval) : []),
        ...(person2Data.length > 0 ? person2Data.map(d => d.interval) : [])
    ];
    const maxInterval = allIntervals.length > 0 ? d3.max(allIntervals) : 2;

    const y = d3.scaleLinear()
        .domain([0, Math.max(2, maxInterval * 1.1)])
        .range([height, 0]);

    const chart = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);


    chart.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .append("text")
        .attr("x", width / 2)
        .attr("y", 40)
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Time (seconds)");


    chart.append("g")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -50)
        .attr("x", -height / 2)
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Stride Interval (s)");


    if (bobData.length > 0) {
        chart.selectAll(".bob-zoom-dot")
            .data(bobData)
            .enter()
            .append("circle")
            .attr("class", "bob-zoom-dot")
            .attr("cx", d => x(d.time))
            .attr("cy", d => y(d.interval))
            .attr("r", 6)
            .attr("fill", bobPerson.color)
            .attr("opacity", 0.8)
            .attr("stroke", "white")
            .attr("stroke-width", 2);
    }


    if (person1Data.length > 0 && person1Person) {
        chart.selectAll(".person1-zoom-dot")
            .data(person1Data)
            .enter()
            .append("circle")
            .attr("class", "person1-zoom-dot")
            .attr("cx", d => x(d.time))
            .attr("cy", d => y(d.interval))
            .attr("r", 6)
            .attr("fill", "#6f42c1")
            .attr("opacity", 0.8)
            .attr("stroke", "white")
            .attr("stroke-width", 2);
    }


    if (person2Data.length > 0 && person2Person) {
        chart.selectAll(".person2-zoom-dot")
            .data(person2Data)
            .enter()
            .append("circle")
            .attr("class", "person2-zoom-dot")
            .attr("cx", d => x(d.time))
            .attr("cy", d => y(d.interval))
            .attr("r", 6)
            .attr("fill", "#fd7e14")
            .attr("opacity", 0.8)
            .attr("stroke", "white")
            .attr("stroke-width", 2);
    }


    currentZoomData = { bob: bobData, person1: person1Data, person2: person2Data };
}

async function playMultiWalk() {
    const bobZoom = currentFilteredBobData || [];
    const person1Zoom = currentFilteredPerson1Data || [];
    const person2Zoom = currentFilteredPerson2Data || [];

    if (!bobZoom.length && !person1Zoom.length && !person2Zoom.length) {
        console.log("No data to replay in multi-walk.");
        return;
    }

    multiPlayBtn.disabled = true;
    multiPlayBtn.textContent = "Playing...";


    document.getElementById("bobMultiEmoji").style.transform = "translateX(0px)";
    if (person1MultiEmoji) person1MultiEmoji.style.transform = "translateX(0px)";
    if (person2MultiEmoji) person2MultiEmoji.style.transform = "translateX(0px)";

    const timer4 = document.getElementById("timer4");
    if (timer4) startTimer(timer4);

    const allSteps = [
        ...bobZoom.map(d => ({ time: d.time, type: 'bob' })),
        ...person1Zoom.map(d => ({ time: d.time, type: 'person1' })),
        ...person2Zoom.map(d => ({ time: d.time, type: 'person2' }))
    ];

    allSteps.sort((a, b) => a.time - b.time);

    const baseTime = allSteps[0].time;
    let maxAnimationTime = 0;

    allSteps.forEach((step, i) => {
        const delay = (step.time - baseTime) * 1000;
        maxAnimationTime = Math.max(maxAnimationTime, delay);

        setTimeout(() => {
            let charElement;
            let dotSelector;
            let fillColor;

            if (step.type === 'bob') {
                charElement = document.getElementById("bobMultiEmoji");
                dotSelector = ".bob-zoom-dot";
                fillColor = "#007acc";
            } else if (step.type === 'person1' && person1MultiEmoji) {
                charElement = person1MultiEmoji;
                dotSelector = ".person1-zoom-dot";
                fillColor = "#6f42c1";
            } else if (step.type === 'person2' && person2MultiEmoji) {
                charElement = person2MultiEmoji;
                dotSelector = ".person2-zoom-dot";
                fillColor = "#fd7e14";
            } else {
                return;
            }


            takeStep(charElement);


            const dot = d3.select(charElement.closest('.slide').querySelector('#multiZoomChart')).selectAll(dotSelector)
                .filter(d => d && d.time === step.time);

            if (!dot.empty()) {
                dot.transition()
                    .duration(300)
                    .attr("r", 10)
                    .attr("fill", "#ff6b6b")
                    .attr("opacity", 1)
                    .transition()
                    .duration(300)
                    .attr("r", 6)
                    .attr("fill", fillColor)
                    .attr("opacity", 0.8);
            }
        }, delay);
    });

    setTimeout(() => {
        multiPlayBtn.disabled = false;
        multiPlayBtn.textContent = "Play All Walks";
        if (timer4) timer4.style.display = "none";
    }, maxAnimationTime + 1000);
}
