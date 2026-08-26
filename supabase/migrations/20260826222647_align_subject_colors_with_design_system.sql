begin;

alter table public.subjects disable trigger subjects_record_audit;

update public.subjects
set color = case code
  when 'LP' then '#F97316'
  when 'ML' then '#16A344'
  when 'AED' then '#14B8A6'
  when 'PSGA' then '#D946A1'
  when 'SP4' then '#4C6BFF'
  when 'SHS' then '#EAB308'
  else color
end
where code in ('LP', 'ML', 'AED', 'PSGA', 'SP4', 'SHS');

alter table public.subjects enable trigger subjects_record_audit;

commit;
