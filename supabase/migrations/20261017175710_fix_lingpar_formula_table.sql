begin;

-- GFM treats unescaped pipes in table cells as delimiters. Use LaTeX delimiters
-- for absolute values so the final revision table renders every formula.
do $$
declare
  note_content text;
begin
  select content into note_content
  from public.lesson_notes
  where id = '5d6d780d-02c6-4d60-935b-2f72f0528a71'
  for update;

  if note_content is null or position('$|y|>0$' in note_content) = 0 then
    raise exception 'Expected Lingpar study note formula source was not found';
  end if;

  note_content := replace(note_content, '$|y|>0$', '$\lvert y\rvert>0$');
  note_content := replace(note_content, '$|xy|\le p$', '$\lvert xy\rvert\le p$');
  note_content := replace(note_content, '$|vx|>0$', '$\lvert vx\rvert>0$');
  note_content := replace(note_content, '$|vwx|\le p$', '$\lvert vwx\rvert\le p$');
  note_content := replace(note_content, '$|\mathcal P(A)|>|A|$', '$\lvert\mathcal P(A)\rvert>\lvert A\rvert$');

  update public.lesson_notes set content = note_content
  where id = '5d6d780d-02c6-4d60-935b-2f72f0528a71';
end;
$$;

commit;
