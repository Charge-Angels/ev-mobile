import { EndpointCloud } from '../types/Tenant';

export default class Configuration {
  public static readonly SCP_REST_ENDPOINT_PROD = 'https://sap-ev-rest-server.cfapps.eu10.hana.ondemand.com';
  public static readonly AWS_REST_ENDPOINT_PROD = 'https://rest.e-mobility-group.com';
  public static readonly SCP_REST_ENDPOINT_QA = 'https://sap-ev-rest-server-qa.cfapps.eu10.hana.ondemand.com';

  public static readonly SCP_CAPTCHA_BASE_URL = 'https://evse.cfapps.eu10.hana.ondemand.com';
  public static readonly SCP_CAPTCHA_SITE_KEY = '6Lcmr6EUAAAAAIyn3LasUzk-0MpH2R1COXFYsxNw';

  public static readonly DEFAULT_ENDPOINT_CLOUD_ID = 'scp';
  public static readonly ENDPOINT_CLOUDS: EndpointCloud[] = [
    { id: Configuration.DEFAULT_ENDPOINT_CLOUD_ID, name: 'SAP Cloud Platform', endpoint: Configuration.SCP_REST_ENDPOINT_PROD },
    { id: 'aws', name: 'Amazon Web Service', endpoint: Configuration.AWS_REST_ENDPOINT_PROD },
    { id: 'scpqa', name: 'SAP Cloud Platform QA', endpoint: Configuration.SCP_REST_ENDPOINT_QA }
  ];

  public static isServerLocalePreferred = true;

  public static DEV_ENDPOINT_CLOUDS = [
    {
      id: '127.0.0.1:8020',
      name: '127.0.0.1:8020',
      endpoint: 'http://127.0.0.1:8020'
    },
    {
      id: '10.0.2.2:8020',
      name: 'android-local:8020',
      endpoint: 'http://10.0.2.2:8020'
    }
  ];

  public static readonly DEVELOPMENT_ENDPOINT_CLOUDS: EndpointCloud[] = [
    ...Configuration.ENDPOINT_CLOUDS,
    ...Configuration.DEV_ENDPOINT_CLOUDS
  ];
}
