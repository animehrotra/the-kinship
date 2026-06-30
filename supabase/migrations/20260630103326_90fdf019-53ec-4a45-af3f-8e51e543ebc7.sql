
CREATE POLICY "Users can update their own interactions"
ON public.interactions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback screenshots"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'feedback-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'feedback-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own feedback screenshots"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'feedback-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);
