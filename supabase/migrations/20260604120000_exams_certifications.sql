-- =========== MODULE EXAMS ===========
-- One final exam per category/module. questions is a JSONB array:
-- [{ "q": "...", "options": ["A","B","C","D"], "answer": 0 }, ...]
CREATE TABLE public.module_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Final Exam',
  questions JSONB NOT NULL DEFAULT '[]',
  pass_score INT NOT NULL DEFAULT 70,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (category_id)
);
ALTER TABLE public.module_exams ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_module_exams_updated
  BEFORE UPDATE ON public.module_exams
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE POLICY "Exams are public" ON public.module_exams FOR SELECT USING (true);
CREATE POLICY "Admins manage exams" ON public.module_exams FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========== CERTIFICATIONS ===========
-- Issued when a user passes a module final exam.
CREATE TABLE public.certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  score INT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, category_id)
);
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own certs" ON public.certifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System issues certs" ON public.certifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all certs" ON public.certifications FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- =========== QUIZ RESULTS ===========
-- Stores the result of a per-lesson quiz attempt (latest only).
CREATE TABLE public.quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  score INT NOT NULL,
  passed BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own quiz results" ON public.quiz_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users submit quiz results" ON public.quiz_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own quiz results" ON public.quiz_results FOR UPDATE USING (auth.uid() = user_id);
