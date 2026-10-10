import { HardDrive, LogIn, Sparkles, TerminalSquare, UserPlus } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { z } from 'zod'
import { LogoMark } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Api, ApiError } from '@/lib/api'
import { setSession } from '@/lib/auth'
import { useUiVariant } from '@/lib/ui-variant'

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Bitte gib mindestens 2 Zeichen ein.').max(100),
  email: z.email('Bitte gib eine gültige E-Mail-Adresse ein.'),
  password: z.string().min(8, 'Mindestens 8 Zeichen.'),
})

const loginSchema = registerSchema.pick({ email: true }).extend({ password: z.string().min(1, 'Bitte gib dein Passwort ein.') })

type Errors = Partial<Record<'name' | 'email' | 'password', string>>

function useAuthForm<T extends z.ZodType>(schema: T, submit: (data: z.infer<T>) => Promise<void>) {
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget))
    const parsed = schema.safeParse(values)
    if (!parsed.success) {
      const next: Errors = {}
      for (const issue of parsed.error.issues) next[issue.path[0] as keyof Errors] ??= issue.message
      setErrors(next)
      return
    }
    setErrors({})
    setBusy(true)
    try {
      await submit(parsed.data)
    } catch (error) {
      if (error instanceof ApiError) {
        const next: Errors = {}
        for (const [key, messages] of Object.entries(error.errors)) next[key as keyof Errors] = messages[0]
        setErrors(Object.keys(next).length ? next : { email: error.message })
      } else {
        setErrors({ email: 'Verbindung zum Server fehlgeschlagen.' })
      }
    } finally {
      setBusy(false)
    }
  }

  return { errors, busy, onSubmit }
}

const AUTH_POINTS = [
  { icon: HardDrive, title: 'Läuft lokal', text: 'Konto, Notizen und Fortschritt liegen in der Datenbank auf deinem Rechner.' },
  { icon: TerminalSquare, title: 'Echte Werkzeuge', text: 'Jede Übung landet als Datei in deinem Workspace – öffne sie mit deinem Editor.' },
  { icon: Sparkles, title: 'Dein Lexikon wächst mit', text: 'Jeder Begriff, den du liest, wird für dich freigeschaltet.' },
]

function AuthLayout({ title, description, children, footer }: { title: string; description: string; children: React.ReactNode; footer: React.ReactNode }) {
  const apple = useUiVariant() === 'apple'
  const card = (
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center text-center">
        <LogoMark className="mx-auto h-8" />
        <CardTitle className="mt-3 text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {children}
        <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
      </CardContent>
    </Card>
  )

  if (apple) return <div className="flex min-h-[calc(100svh-3.5rem)] items-center justify-center px-4 py-12">{card}</div>

  return (
    <div className="mx-auto grid min-h-[calc(100svh-3.5rem)] max-w-6xl items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-20">
      <aside className="hidden lg:block">
        <p className="eyebrow">Stacklab</p>
        <p className="mt-4 text-4xl leading-[1.08] font-semibold tracking-[-0.035em]">Dein Fortschritt.<br />Deine Maschine.</p>
        <ul className="mt-10 space-y-5">
          {AUTH_POINTS.map((point) => (
            <li key={point.title} className="flex gap-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-card text-primary shadow-card"><point.icon className="size-4" /></span>
              <span>
                <span className="block font-medium">{point.title}</span>
                <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">{point.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </aside>
      <div className="flex justify-center lg:justify-end">
        <Card className="w-full max-w-md shadow-raised">
          <CardHeader className="px-6 pt-2 sm:px-8">
            <LogoMark className="h-7 w-fit lg:hidden" />
            <CardTitle className="mt-3 text-2xl font-semibold tracking-[-0.02em] lg:mt-0">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-2 sm:px-8">
            {children}
            <p className="mt-6 text-sm text-muted-foreground">{footer}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('weiter')?.startsWith('/') ? params.get('weiter')! : '/'
  const form = useAuthForm(loginSchema, async (data) => {
    const session = await Api.login(data)
    setSession(session.token, session.user)
    navigate(next, { replace: true })
  })

  useEffect(() => {
    document.title = 'Anmelden · Stacklab'
  }, [])

  return (
    <AuthLayout title="Willkommen zurück" description="Melde dich mit deinem lokalen Stacklab-Konto an." footer={<>Noch kein Konto? <Link to="/registrieren" className="font-medium text-brand hover:underline">Jetzt anlegen</Link></>}>
      <form onSubmit={form.onSubmit} noValidate>
        <FieldGroup>
          <Field data-invalid={Boolean(form.errors.email)}>
            <FieldLabel htmlFor="email">E-Mail</FieldLabel>
            <Input id="email" name="email" type="email" autoComplete="email" required aria-invalid={Boolean(form.errors.email)} />
            <FieldError>{form.errors.email}</FieldError>
          </Field>
          <Field data-invalid={Boolean(form.errors.password)}>
            <FieldLabel htmlFor="password">Passwort</FieldLabel>
            <Input id="password" name="password" type="password" autoComplete="current-password" required aria-invalid={Boolean(form.errors.password)} />
            <FieldError>{form.errors.password}</FieldError>
          </Field>
          <Button type="submit" size="lg" disabled={form.busy}>{form.busy ? <Spinner /> : <LogIn />} Anmelden</Button>
        </FieldGroup>
      </form>
    </AuthLayout>
  )
}

export function RegisterPage() {
  const navigate = useNavigate()
  const form = useAuthForm(registerSchema, async (data) => {
    const session = await Api.register(data)
    setSession(session.token, session.user)
    navigate('/', { replace: true })
  })

  useEffect(() => {
    document.title = 'Konto anlegen · Stacklab'
  }, [])

  return (
    <AuthLayout
      title="Konto anlegen"
      description="Dein Konto liegt nur in der lokalen Datenbank auf deinem Rechner."
      footer={<>Schon registriert? <Link to="/anmelden" className="font-medium text-brand hover:underline">Anmelden</Link></>}
    >
      <form onSubmit={form.onSubmit} noValidate>
        <FieldGroup>
          <Field data-invalid={Boolean(form.errors.name)}>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input id="name" name="name" autoComplete="name" required aria-invalid={Boolean(form.errors.name)} />
            <FieldError>{form.errors.name}</FieldError>
          </Field>
          <Field data-invalid={Boolean(form.errors.email)}>
            <FieldLabel htmlFor="email">E-Mail</FieldLabel>
            <Input id="email" name="email" type="email" autoComplete="email" required aria-invalid={Boolean(form.errors.email)} />
            <FieldError>{form.errors.email}</FieldError>
          </Field>
          <Field data-invalid={Boolean(form.errors.password)}>
            <FieldLabel htmlFor="password">Passwort</FieldLabel>
            <Input id="password" name="password" type="password" autoComplete="new-password" required aria-invalid={Boolean(form.errors.password)} />
            <FieldError>{form.errors.password}</FieldError>
          </Field>
          <Button type="submit" size="lg" disabled={form.busy}>{form.busy ? <Spinner /> : <UserPlus />} Konto anlegen</Button>
        </FieldGroup>
      </form>
    </AuthLayout>
  )
}
