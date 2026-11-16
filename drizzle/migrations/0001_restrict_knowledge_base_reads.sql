DROP POLICY IF EXISTS "Anyone reads knowledge" ON public.knowledge_base;
CREATE POLICY "Admins read knowledge" ON public.knowledge_base FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
REVOKE SELECT ON public.knowledge_base FROM anon;

CREATE OR REPLACE FUNCTION public.get_chat_knowledge()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$ SELECT content FROM public.knowledge_base WHERE id = 1 $$;
REVOKE ALL ON FUNCTION public.get_chat_knowledge() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_chat_knowledge() TO anon, authenticated, service_role;