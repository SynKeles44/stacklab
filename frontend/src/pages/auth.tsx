import { LogIn, UserPlus } from 'lucide-react'
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

function AuthLayout({ title, description, children, footer }: { title: string; description: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="relative flex min-h-[calc(100svh-3.5rem)] items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <Card className="relative w-full max-w-md shadow-xl">
        <CardHeader className="items-center text-center">
          <LogoMark className="mx-auto h-10" />
          <CardTitle className="mt-2 text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {children}
          <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
        </CardContent>
      </Card>
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
