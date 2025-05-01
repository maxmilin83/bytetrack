# ByteTrack App 🍽️

## 📖 Overview

**ByteTrack** is a mobile application that helps users track their daily food intake and nutritional information. The app uses **AI-powered image analysis** to identify food items and calculate their nutritional values, including:

- Calories
- Protein
- Carbohydrates
- Fat

Users can log meals, set calorie targets, and monitor progress toward dietary goals. The app integrates with **OpenAI's GPT-4** to analyze food images and return structured nutritional data in JSON format. It also supports manual entries, meal deletion, and resetting the analysis state.

---

## ✨ Features

### 1. AI-Powered Food Analysis

- Upload an image of a meal.
- GPT-4 analyzes the image and returns a JSON response with:
  - Food name
  - Calories
  - Protein
  - Carbohydrates
  - Fat
- If no food is detected, an error message is returned.

### 2. Meal Logging

- Add analyzed meals to a daily log.
- View a summary of:
  - Total calories
  - Total protein
  - Total carbohydrates
  - Total fat
- Meals can be deleted with confirmation.

### 3. Calorie Target Tracking

- Set a daily calorie target.
- Visual progress display shows how close users are to reaching their goal.

### 4. Manual Entry

- Enter meal details manually if desired.


### 4. View progress across dates

- Progress can be viewed across different dates and also monthly / weekly progress can be viewed in a bar chart format

### 6. Error Handling

- Friendly error messages for:
  - Invalid image formats
  - API request failures
  - Image analysis errors

---

## 🧱 Key Components

### Frontend

- Built with **Ionic** and **Angular** for a responsive UI.
- Displays analysis results, meal logs, and progress.

### Backend Integration

- Uses **OpenAI’s GPT-4 API** for food analysis.
- Sends POST requests and handles structured responses.

### Services

- `OpenAiService`:
  - Communicates with the OpenAI API
  - Parses JSON
  - Handles API errors
- `DataStorageService`:
  - Manages local storage of logs and preferences

---

## 🛠️ Installation and Setup

### Prerequisites

- Node.js and npm
- Ionic CLI
- OpenAI API key

### Steps

```bash
# Clone the repository
git clone https://github.com/your-username/bytetrack.git
cd bytetrack

# Install dependencies
npm install




# Set up environment variables
# Add your OpenAI API key in environment.ts

# Run the app
ionic serve

```

## 🛠📱 Android Installion

To run the app on android , you will first need to download android studio.

### Steps

1. ionic build

2. npx cap sync android

3. npx cap open android

4. press play at the top in android studio




