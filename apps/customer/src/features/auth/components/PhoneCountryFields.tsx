"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Input } from "@repo/ui/input";
import { Field } from "@repo/ui/field";
import type { CountryCode } from "@repo/utils/phone";

type PhoneFormValues = {
  country: CountryCode;
  phoneLocal: string;
};

type PhoneCountryFieldsProps = {
  register: UseFormRegister<PhoneFormValues>;
  errors: FieldErrors<PhoneFormValues>;
  country: CountryCode;
};

export function PhoneCountryFields({
  register,
  errors,
  country,
}: PhoneCountryFieldsProps) {
  const t = useTranslations("auth");

  return (
    <Field
      label={t("fields.phone")}
      htmlFor="phoneLocal"
      error={errors.phoneLocal?.message}
    >
      <div className="flex gap-2">
        <select
          id="country"
          aria-label={t("fields.country")}
          className="h-9 w-[6.75rem] shrink-0 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          {...register("country")}
        >
          <option value="NP">{t("dialCodes.NP")}</option>
          <option value="FI">{t("dialCodes.FI")}</option>
          <option value="AU">{t("dialCodes.AU")}</option>
        </select>
        <Input
          id="phoneLocal"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          className="min-w-0 flex-1"
          placeholder={t(`placeholders.phone${country}`)}
          {...register("phoneLocal")}
        />
      </div>
    </Field>
  );
}
