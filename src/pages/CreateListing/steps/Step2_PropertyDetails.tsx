// src/pages/CreateListing/steps/Step2_PropertyDetails.tsx
import React from 'react';
import { ListingForm } from '../../../types';
import Step2_Developer  from './Step2_Developer';
import Step2_OwnerAgent from './Step2_OwnerAgent';

type Props = {
  formData: ListingForm;
  setFormData: React.Dispatch<React.SetStateAction<ListingForm>>;
  onChange: (e: React.ChangeEvent<any>) => void;
  /* optional extras some versions expected */
  availableFromDate?: Date;
  setAvailableFromDate?: React.Dispatch<React.SetStateAction<Date | undefined>>;
  showCalendar?: boolean;
  setShowCalendar?: React.Dispatch<React.SetStateAction<boolean>>;
  setLocationCoords?: (coords: { lat: number; lng: number } | null) => void;
};

const Step2_PropertyDetails: React.FC<Props> = (props) =>
  props.formData.userType === 'developer'
    ? <Step2_Developer  {...props} />
    : <Step2_OwnerAgent {...props} />;

export default Step2_PropertyDetails;
