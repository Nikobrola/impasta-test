# 🎮 Impasta Game

A social deduction game where players answer questions and try to identify impostors among them.

## 🎯 Game Modes

- **Questions Mode**: Players answer questions and try to spot impostors with different questions
- **Words Mode**: Players describe words while impostors try to blend in without knowing the word

## 🎨 Features

- **Multiple Question Packs**: Party, Spicy, Normal, and Custom questions
- **Multiple Word Packs**: Celebrities, Characters, Objects, Spicy, and Custom words
- **Randomize Mode**: Multiple rounds with one elimination per round
- **Standard Mode**: Single round elimination
- **Jester Role**: Optional role that wins when voted out
- **Tie-Breaking**: Automatic tie-breaking rounds until clear winner
- **Bot Players**: AI players for testing and solo play

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/lukaodishvili/goat-project.git
cd goat-project
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to the local URL (usually `http://localhost:5173`)

## 🎮 How to Play

1. **Create or Join a Room**: Enter a room code or create a new one
2. **Select Game Mode**: Choose between Questions or Words mode
3. **Pick a Pack**: Select from various question/word packs
4. **Configure Game**: Set impostor count, jester, and game mode
5. **Start Playing**: Answer questions or describe words
6. **Vote**: Identify and vote out impostors
7. **Win**: Achieve your team's victory condition

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Project Structure

```
src/
├── components/     # React components
├── utils/         # Game logic and utilities
├── types/         # TypeScript type definitions
├── data/          # Game content and packs
└── hooks/         # Custom React hooks
```

## 🎨 Tech Stack

- **React** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Custom game logic** for social deduction mechanics

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

Luka Odishvili - [@lukaodishvili](https://github.com/lukaodishvili)

Project Link: [https://github.com/lukaodishvili/goat-project](https://github.com/lukaodishvili/goat-project)
