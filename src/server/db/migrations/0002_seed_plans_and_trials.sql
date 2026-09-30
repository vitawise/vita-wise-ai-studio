-- Plan catalogue (prices are placeholders until the owner confirms them; editable in admin later).
INSERT INTO `plans` (`id`, `name_ar`, `name_en`, `price_sar`, `monthly_credits`, `features`, `is_public`, `sort_order`) VALUES
  ('trial', 'تجربة مجانية', 'Free trial', 0, 50, '{"sallaSync":false,"trends":true,"maxUsers":1}', false, 0),
  ('starter', 'الأساسية', 'Starter', 199, 300, '{"sallaSync":true,"trends":false,"maxUsers":2}', true, 1),
  ('pro', 'الاحترافية', 'Pro', 499, 1000, '{"sallaSync":true,"trends":true,"maxUsers":5}', true, 2),
  ('chain', 'السلاسل', 'Chain', 1299, 3000, '{"sallaSync":true,"trends":true,"maxUsers":20}', true, 3);
--> statement-breakpoint
-- Pharmacies created before billing existed get the same trial as new sign-ups.
INSERT INTO `subscriptions` (`pharmacy_id`, `plan_id`, `status`, `current_period_end`)
  SELECT p.`id`, 'trial', 'trialing', DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL 14 DAY)
  FROM `pharmacies` p
  WHERE NOT EXISTS (SELECT 1 FROM `subscriptions` s WHERE s.`pharmacy_id` = p.`id`);
--> statement-breakpoint
INSERT INTO `credit_ledger` (`id`, `pharmacy_id`, `delta`, `reason`, `ref_type`, `ref_id`)
  SELECT UUID(), p.`id`, 50, 'trial.grant', 'pharmacy', p.`id`
  FROM `pharmacies` p
  WHERE NOT EXISTS (
    SELECT 1 FROM `credit_ledger` l
    WHERE l.`ref_type` = 'pharmacy' AND l.`ref_id` = p.`id` AND l.`reason` = 'trial.grant'
  );
--> statement-breakpoint
UPDATE `pharmacies` p
  SET p.`credits_balance` = (SELECT COALESCE(SUM(l.`delta`), 0) FROM `credit_ledger` l WHERE l.`pharmacy_id` = p.`id`);
