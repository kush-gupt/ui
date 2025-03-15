import React, { useEffect } from 'react';
import { ContributionFormData } from '@/types';
import { ValidatedOptions, FormGroup, TextInput, FormHelperText, HelperText, HelperTextItem, FlexItem, Flex, Form } from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import WizardPageHeader from '@/components/Common/WizardPageHeader';
import WizardFormGroupLabelHelp from '@/components/Common/WizardFormGroupLabelHelp';

interface Props {
  isEditForm?: boolean;
  contributionFormData: ContributionFormData;
  titleWork: string;
  setTitleWork: (val: string) => void;
  linkWork?: string;
  setLinkWork?: (val: string) => void;
  revision?: string;
  setRevision?: (val: string) => void;
  licenseWork: string;
  setLicenseWork: (val: string) => void;
  creators: string;
  setCreators: (val: string) => void;
}

const AttributionInformation: React.FC<Props> = ({
  isEditForm,
  titleWork,
  setTitleWork,
  linkWork = '',
  setLinkWork,
  revision = '',
  setRevision,
  licenseWork,
  setLicenseWork,
  creators,
  setCreators
}) => {
  const [validTitle, setValidTitle] = React.useState<ValidatedOptions>();
  const [validLink, setValidLink] = React.useState<ValidatedOptions>();
  const [validRevision, setValidRevision] = React.useState<ValidatedOptions>();
  const [validLicense, setValidLicense] = React.useState<ValidatedOptions>();
  const [validCreators, setValidCreators] = React.useState<ValidatedOptions>();

  useEffect(() => {
    if (!isEditForm) {
      return;
    }
    setValidTitle(ValidatedOptions.success);
    setValidLink(ValidatedOptions.success);
    setValidRevision(ValidatedOptions.success);
    setValidLicense(ValidatedOptions.success);
    setValidCreators(ValidatedOptions.success);
  }, [isEditForm]);

  const validateTitle = (titleStr: string) => {
    const title = titleStr.trim();
    if (title.length > 0) {
      setValidTitle(ValidatedOptions.success);
      return;
    }
    setValidTitle(ValidatedOptions.error);
    return;
  };

  const validateLink = (linkStr: string) => {
    const link = linkStr.trim();
    if (link.length === 0) {
      setValidLink(ValidatedOptions.error);
      return;
    }
    try {
      new URL(link);
      setValidLink(ValidatedOptions.success);
    } catch (e) {
      setValidLink(ValidatedOptions.warning);
    }
  };

  const validateRevision = (revisionStr: string) => {
    const revision = revisionStr.trim();
    setValidRevision(revision.length > 0 ? ValidatedOptions.success : ValidatedOptions.error);
  };

  const validateLicense = (licenseStr: string) => {
    const license = licenseStr.trim();
    setValidLicense(license.length > 0 ? ValidatedOptions.success : ValidatedOptions.error);
  };

  const validateCreators = (creatorsStr: string) => {
    const creators = creatorsStr.trim();
    setValidCreators(creators.length > 0 ? ValidatedOptions.success : ValidatedOptions.error);
  };

  return (
    <Flex gap={{ default: 'gapMd' }} direction={{ default: 'column' }}>
      <FlexItem>
        <WizardPageHeader title="Attribution details" description="Provide attribution information." />
      </FlexItem>
      <FlexItem>
        <Form>
          <FormGroup
            isRequired
            key={'attribution-info-details-title_work'}
            label="Title"
            labelHelp={<WizardFormGroupLabelHelp bodyContent="Description of work title" />}
          >
            <TextInput
              isRequired
              type="text"
              aria-label="title_work"
              validated={validTitle}
              value={titleWork}
              onChange={(_event, value) => setTitleWork(value)}
              onBlur={() => validateTitle(titleWork)}
            />
            {validTitle === ValidatedOptions.error && (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem icon={<ExclamationCircleIcon />} variant={validTitle}>
                    Required field
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>
          {setLinkWork ? (
            <FormGroup
              isRequired
              key={'attribution-info-details-work_link'}
              label="Link to work"
              labelHelp={<WizardFormGroupLabelHelp bodyContent="Description of link to work" />}
            >
              <TextInput
                isRequired
                type="url"
                aria-label="link_work"
                validated={validLink}
                value={linkWork}
                onChange={(_event, value) => setLinkWork(value)}
                onBlur={() => validateLink(linkWork)}
              />
              {validLink === ValidatedOptions.error && (
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem icon={<ExclamationCircleIcon />} variant={validLink}>
                      Required field
                    </HelperTextItem>
                  </HelperText>
                </FormHelperText>
              )}
              {validLink === ValidatedOptions.warning && (
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem icon={<ExclamationCircleIcon />} variant={validLink}>
                      Please enter a valid URL.
                    </HelperTextItem>
                  </HelperText>
                </FormHelperText>
              )}
            </FormGroup>
          ) : null}
          {setRevision ? (
            <FormGroup
              isRequired
              key={'attribution-info-details-document_revision'}
              label="Revision"
              labelHelp={<WizardFormGroupLabelHelp bodyContent="Description of revision" />}
            >
              <TextInput
                isRequired
                type="text"
                aria-label="revision"
                validated={validRevision}
                value={revision}
                onChange={(_event, value) => setRevision(value)}
                onBlur={() => validateRevision(revision)}
              />
              {validRevision === ValidatedOptions.error && (
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem icon={<ExclamationCircleIcon />} variant={validRevision}>
                      Required field
                    </HelperTextItem>
                  </HelperText>
                </FormHelperText>
              )}
            </FormGroup>
          ) : null}
          <FormGroup
            isRequired
            key={'attribution-info-details-license'}
            label="License of the work"
            labelHelp={<WizardFormGroupLabelHelp bodyContent="Description of license of the work" />}
          >
            <TextInput
              isRequired
              type="text"
              aria-label="license_work"
              validated={validLicense}
              value={licenseWork}
              onChange={(_event, value) => setLicenseWork(value)}
              onBlur={() => validateLicense(licenseWork)}
            />
            {validLicense === ValidatedOptions.error && (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem icon={<ExclamationCircleIcon />} variant={validLicense}>
                    Required field
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>
          <FormGroup isRequired key={'attribution-info-details-creators'} label="Author(s)">
            <TextInput
              isRequired
              type="text"
              aria-label="author"
              validated={validCreators}
              value={creators}
              onChange={(_event, value) => setCreators(value)}
              onBlur={() => validateCreators(creators)}
            />
            {validCreators === ValidatedOptions.error && (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem icon={<ExclamationCircleIcon />} variant={validCreators}>
                    Required field
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>
        </Form>
      </FlexItem>
    </Flex>
  );
};

export default AttributionInformation;
