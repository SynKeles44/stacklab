import { ArrowRight, CheckCircle2, RotateCcw, Trophy, XCircle } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Api } from '@/lib/api'
import { getToken } from '@/lib/auth'
import type { Question } from '@/lib/content-schemas'
import { emptyAnswer, isAnswered, isCorrect, toPublic, type Answer } from '@/lib/quiz'
import { cn } from '@/lib/utils'
import { InlineMarkdown, QuestionView } from './question-view'

type Props = { lessonId: number; questions: Question[]; best: { score: number; max_score: number } | null; onFinished?: (score: number, max: number) => void }

export function LessonQuiz({ lessonId, questions, best, onFinished }: Props) {
  const [round, setRound] = useState(0)
  const publicQuestions = useMemo(() => questions.map((question, index) => toPublic(question, `${lessonId}-${index}-${round}`)), [questions, lessonId, round])
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>(() => publicQuestions.map(emptyAnswer))
  const [checked, setChecked] = useState<boolean[]>(() => questions.map(() => false))
  const [finished, setFinished] = useState(false)

  const question = questions[index]!
  const view = publicQuestions[index]!
  const answer = answers[index] ?? null
  const isChecked = checked[index] ?? false
  const correct = isChecked && isCorrect(question, answer)
  const score = questions.reduce((sum, q, i) => sum + (checked[i] && isCorrect(q, answers[i] ?? null) ? 1 : 0), 0)

  const check = () => {
    setChecked((previous) => previous.map((value, i) => (i === index ? true : value)))
  }

  const next = async () => {
    if (index < questions.length - 1) {
      setIndex(index + 1)
      return
    }
    setFinished(true)
    onFinished?.(score, questions.length)
    if (getToken()) {
      await Api.submitQuiz(lessonId, { score, max_score: questions.length, answers }).catch(() => undefined)
    }
  }

  const restart = () => {
    const nextRound = round + 1
    setRound(nextRound)
    setIndex(0)
    setAnswers(questions.map((q, i) => emptyAnswer(toPublic(q, `${lessonId}-${i}-${nextRound}`))))
    setChecked(questions.map(() => false))
    setFinished(false)
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-xl">Quiz</CardTitle>
          <span className="text-sm text-muted-foreground">
            {finished ? 'Abgeschlossen' : `Frage ${index + 1} von ${questions.length}`}
            {best && !finished && <span className="ml-2 hidden sm:inline">· Bestes Ergebnis: {best.score}/{best.max_score}</span>}
          </span>
        </div>
        <Progress value={((finished ? questions.length : index + (isChecked ? 1 : 0)) / questions.length) * 100} className="h-1.5" />
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {finished ? (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="py-6 text-center">
              <Trophy className={cn('mx-auto size-12', score / questions.length >= 0.8 ? 'text-warning' : 'text-muted-foreground')} />
              <p className="mt-3 text-3xl font-bold">
                {score} / {questions.length}
              </p>
              <p className="mt-1 text-muted-foreground">
                {score === questions.length
                  ? 'Perfekt! Du hast alles verstanden.'
                  : score / questions.length >= 0.8
                    ? 'Sehr gut – fast alles richtig.'
                    : 'Lies die markierten Stellen noch einmal und versuch es erneut.'}
              </p>
              <Button variant="outline" className="mt-5" onClick={restart}>
                <RotateCcw /> Quiz wiederholen
              </Button>
            </motion.div>
          ) : (
            <motion.div key={`${round}-${index}`} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
              <QuestionView
                idPrefix={`q-${lessonId}-${round}-${index}`}
                question={view}
                value={answer}
                onChange={(value) => setAnswers((previous) => previous.map((item, i) => (i === index ? value : item)))}
                reveal={isChecked ? question : null}
              />

              <AnimatePresence>
                {isChecked && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn('mt-4 rounded-xl border p-4', correct ? 'border-success/40 bg-success/8' : 'border-destructive/40 bg-destructive/8')}
                  >
                    <p className="flex items-center gap-2 font-semibold">
                      {correct ? <CheckCircle2 className="size-5 text-success" /> : <XCircle className="size-5 text-destructive" />}
                      {correct ? 'Richtig!' : 'Nicht ganz.'}
                    </p>
                    <InlineMarkdown text={question.explanation} className="mt-1 text-sm leading-relaxed text-foreground/85" />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-5 flex justify-end">
                {isChecked ? (
                  <Button onClick={next}>
                    {index < questions.length - 1 ? 'Nächste Frage' : 'Ergebnis anzeigen'} <ArrowRight />
                  </Button>
                ) : (
                  <Button onClick={check} disabled={!isAnswered(view, answer)}>
                    Antwort prüfen
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
