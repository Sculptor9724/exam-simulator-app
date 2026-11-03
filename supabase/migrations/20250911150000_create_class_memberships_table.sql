-- Create class_memberships table for student-class relationships
CREATE TABLE class_memberships (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_id, user_id) -- Prevent duplicate memberships
);

-- Enable RLS
ALTER TABLE class_memberships ENABLE ROW LEVEL SECURITY;

-- Students can view their own memberships
CREATE POLICY "Students can view their own memberships"
ON class_memberships FOR SELECT
USING ( auth.uid() = user_id );

-- Students can join classes (insert their own memberships)
CREATE POLICY "Students can join classes"
ON class_memberships FOR INSERT
WITH CHECK ( auth.uid() = user_id );

-- Students can leave classes (delete their own memberships)
CREATE POLICY "Students can leave classes"
ON class_memberships FOR DELETE
USING ( auth.uid() = user_id );

-- Teachers can view memberships for their classes
CREATE POLICY "Teachers can view class memberships"
ON class_memberships FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = class_memberships.class_id
    AND classes.user_id = auth.uid()
  )
);

-- Teachers can remove students from their classes
CREATE POLICY "Teachers can remove students from their classes"
ON class_memberships FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = class_memberships.class_id
    AND classes.user_id = auth.uid()
  )
);
