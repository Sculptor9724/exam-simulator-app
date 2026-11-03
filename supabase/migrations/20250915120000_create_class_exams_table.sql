-- Create class_exams junction table for many-to-many relationship between classes and exams
CREATE TABLE IF NOT EXISTS public.class_exams (
    id bigserial PRIMARY KEY,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    exam_id bigint NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure unique combination of class and exam
    UNIQUE(class_id, exam_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_class_exams_class_id ON public.class_exams(class_id);
CREATE INDEX IF NOT EXISTS idx_class_exams_exam_id ON public.class_exams(exam_id);

-- Enable Row Level Security
ALTER TABLE public.class_exams ENABLE ROW LEVEL SECURITY;

-- Create policies for class_exams table
-- Teachers can manage class exams for their own classes
CREATE POLICY "Teachers can manage class exams for their own classes"
ON public.class_exams
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.classes
        WHERE classes.id = class_exams.class_id
        AND classes.user_id = auth.uid()
    )
);

-- Students can view class exams for classes they are members of
CREATE POLICY "Students can view class exams for their classes"
ON public.class_exams
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.class_memberships cm
        JOIN public.profiles p ON cm.profile_id = p.id
        WHERE cm.class_id = class_exams.class_id
        AND p.user_id = auth.uid()
    )
);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_class_exams_updated_at
    BEFORE UPDATE ON public.class_exams
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
