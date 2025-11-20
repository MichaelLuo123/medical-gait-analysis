## DSC-106 Final Project – Gait Pattern Analyzer

This project visualizes gait datasets and now includes a computer-vision recording mode that compares your recorded walk against the clinical dataset.

### Running Locally

1. Open `index.html` directly in a browser, or
2. Serve the folder via a local server, e.g.
   ```bash
   cd DSC-106-Final-Project
   python -m http.server 8000
   ```
   Then visit `http://localhost:8000`.

### Computer Vision Recording (Beta)

1. From the first slide, click **Enable Camera Tracking** to grant webcam access.
2. Ensure your full body is visible; the MoveNet detector estimates ankle movement.
3. Press **Start Recording** to capture 10 seconds of walking. Steps detected from the live pose feed are compared with every dataset panel throughout the experience.

If the camera fails to initialize, you can still use the on-screen character to record steps manually.
