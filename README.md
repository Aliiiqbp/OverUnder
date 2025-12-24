# OverUnder 📈

OverUnder is an intelligent, AI-powered stock valuation assistant that helps investors determine if a stock is **Overvalued**, **Undervalued**, or **Fairly Valued**.

Built with **React**, **TypeScript**, and **Google Gemini 2.5**, it analyzes real-time market data, financial ratios (P/E, PEG, P/B), and recent news to provide a comprehensive intrinsic valuation report with visual indicators.

## 🚀 Features

-   **AI Valuation Analysis**: Uses Gemini 2.5 Pro/Flash to synthesize financial data into a clear "Buy", "Hold", or "Sell" recommendation.
-   **Visual Indicators**: Intuitive, color-coded bars comparing company metrics (P/E, P/S, etc.) against industry benchmarks.
-   **Real-time Grounding**: Utilizes Google Search tool to fetch the latest stock prices and news events.
-   **Multi-Session Chat**: Manage multiple analysis sessions with persistent history (stored in browser local storage).
-   **Secure Environment**: API keys are managed via environment variables.

## 🛠️ Getting Started

Follow these instructions to set up the project locally.

### Prerequisites

-   Node.js (v18 or higher)
-   An API Key from [Google AI Studio](https://aistudio.google.com/) (Must have access to Gemini 2.5 or 3.0 models).

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/overunder.git
    cd overunder
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Create a `.env` file in the root directory and add your Google Gemini API key.
    
    ```env
    API_KEY=your_gemini_api_key_here
    ```

4.  **Run the application**
    ```bash
    npm run dev
    ```

5.  Open your browser to the local server address (usually `http://localhost:5173`).

## 📊 Example Output

**User Query:** *"Analyze Nvidia (NVDA)"*

**Model Response:**

### **NVIDIA Corporation (NVDA)**
**Price:** $135.50 | **Status:** Overvalued (Caution)

**Confidence:** ⭐⭐⭐⭐ (4/5)

**Summary**
NVIDIA is the dominant supplier of AI hardware and software, known for its GPUs used in gaming and data centers. Its core value lies in its CUDA ecosystem and Hopper/Blackwell architecture.
While the company demonstrates exceptional growth, current valuation multiples (P/S > 30) price in near-perfect execution for the next decade, suggesting the stock is technically overvalued compared to historical and industry norms.

**Valuation Indicators**

| Metric | Value | Benchmark (Avg) | Signal |
| :--- | :--- | :--- | :--- |
| **P/E Ratio** | **72.4** | Industry: 35.0 | <span style="color:#ef4444">OVERVALUED</span> |
| **PEG Ratio** | **1.2** | Industry: 1.5 | <span style="color:#10b981">UNDERVALUED</span> |
| **P/S Ratio** | **34.1** | Industry: 8.0 | <span style="color:#ef4444">OVERVALUED</span> |

**Risk Factors**
*   High reliance on a few hyperscaler customers (Microsoft, Meta, Google).
*   Potential geopolitical restrictions on chip exports.
*   Competition from custom silicon (ASICs).

---

## 🔒 Privacy & Data

This application uses your browser's **Local Storage** to persist chat history and user sessions. Your chat data is not sent to any proprietary backend server, but prompt data is processed by Google's Gemini API.

## 📄 License

MIT License
