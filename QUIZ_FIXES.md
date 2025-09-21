# Quiz Component Fixes

## 🐛 **Issues Fixed**

### **1. Round 2/3 Opening Round 1 Instead**

**Problem**: All quiz components (Round1Quiz, Round2Quiz, Round3Quiz) were rendering the generic `Quiz` component without specifying which round to load. The Quiz component was trying to determine the round number from the questions, creating a circular dependency.

**Solution**: 
- Updated all RoundXQuiz components to pass `roundNumber` as a prop
- Modified Quiz component to accept `roundNumber` as a prop instead of deriving it from questions

**Changes Made**:
```typescript
// Before
function Round2Quiz() {
  return <Quiz />  // ❌ No round specified
}

// After  
function Round2Quiz() {
  return <Quiz roundNumber={2} />  // ✅ Round specified
}
```

### **2. Added "Unmark Answer" Functionality**

**Problem**: When a user selected an answer, they could only "Skip Question" but couldn't unmark their selection to change their mind.

**Solution**:
- Added `handleUnmarkAnswer()` function to clear selected answers
- Updated button logic to show "Unmark Answer" when an option is selected
- Show "Skip Question" when no option is selected

**Changes Made**:
```typescript
// New function to unmark answers
const handleUnmarkAnswer = () => {
  const updatedAnswers = answers.map(a => 
    a.questionId === currentQuestion.id 
      ? { ...a, selectedAnswer: null, isCorrect: false }
      : a
  )
  setAnswers(updatedAnswers)
  setSelectedAnswer(null)
}

// Dynamic button rendering
{selectedAnswer ? (
  <button onClick={handleUnmarkAnswer} className="bg-orange-500...">
    Unmark Answer
  </button>
) : (
  <button onClick={handleSkipQuestion} className="bg-yellow-500...">
    Skip Question
  </button>
)}
```

## 🔧 **Technical Implementation**

### **Quiz Component Props** (`frontend/src/components/Quiz.tsx`)
```typescript
interface QuizProps {
  roundNumber: number
}

function Quiz({ roundNumber }: QuizProps) {
  // Now uses the passed roundNumber instead of deriving it
  const response = await fetch(`/api/rounds/${roundNumber}/questions`)
}
```

### **Round Components Updated**
- `Round1Quiz.tsx`: `<Quiz roundNumber={1} />`
- `Round2Quiz.tsx`: `<Quiz roundNumber={2} />`  
- `Round3Quiz.tsx`: `<Quiz roundNumber={3} />`

### **Answer State Management**
```typescript
// Added effect to sync selectedAnswer with current question
useEffect(() => {
  if (currentQuestion && answers.length > 0) {
    const currentAnswer = answers.find(a => a.questionId === currentQuestion.id)
    setSelectedAnswer(currentAnswer?.selectedAnswer || null)
  }
}, [currentQuestionIndex, currentQuestion, answers])
```

## ✅ **Expected Behavior Now**

### **Round Loading**
1. **Round 1**: Loads Round 1 questions from `/api/rounds/1/questions`
2. **Round 2**: Loads Round 2 questions from `/api/rounds/2/questions`
3. **Round 3**: Loads Round 3 questions from `/api/rounds/3/questions`

### **Answer Selection Flow**
1. **No answer selected**: Shows "Skip Question" button (yellow)
2. **Answer selected**: Shows "Unmark Answer" button (orange)
3. **Unmark clicked**: Clears selection, shows "Skip Question" again
4. **Navigation**: Preserves answer state when moving between questions

### **User Experience**
- **Clear feedback**: Button text changes based on selection state
- **Flexible interaction**: Users can change their minds easily
- **Consistent behavior**: Works the same across all rounds
- **Visual distinction**: Different colors for different actions
  - Yellow: Skip Question
  - Orange: Unmark Answer
  - Blue/Green/Purple: Next Question (round-specific)

## 🎯 **Complete User Journey**

1. **Start Round X** → Loads correct round questions
2. **Select answer** → Button changes to "Unmark Answer"
3. **Unmark answer** → Button changes back to "Skip Question"
4. **Navigate questions** → Answer state preserved
5. **Submit quiz** → Correct round data sent to results

The quiz system now works correctly for all rounds with proper answer management!