import React from 'react';
import { ListingForm } from '../../../types';
import Step2_Developer  from './Step2_Developer';
import Step2_OwnerAgent from './Step2_OwnerAgent';

type Props = {
  formData: ListingForm;
  setFormData: React.Dispatch<React.SetStateAction<ListingForm>>;
  onChange: (e: React.ChangeEvent<any>) => void;
};

const Step2_PropertyDetails: React.FC<Props> = (p) =>
  p.formData.userType === 'developer'
    ? <Step2_Developer  {...p} />
    : <Step2_OwnerAgent {...p} />;

export default Step2_PropertyDetails;
