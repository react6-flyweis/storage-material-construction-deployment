import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import backarrow from "../assets/backarrowicon.svg";
import {
  useProfile,
  useUpdateNotificationSettingsMutation,
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationSettings,
} from "../modules/profile";
import { getApiErrorMessage } from "../lib/api-error";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

interface SettingsViewProps {
  onNavigate?: (view: "profile") => void;
}

const SettingsView: React.FC<SettingsViewProps> = () => {
  const navigate = useNavigate();

  const {
    data: profile,
    isLoading: isProfileLoading,
    error: profileError,
  } = useProfile();

  const updateNotificationSettingsMutation =
    useUpdateNotificationSettingsMutation();

  const [settings, setSettings] = useState<Required<NotificationSettings>>(
    DEFAULT_NOTIFICATION_SETTINGS
  );

  useEffect(() => {
    if (profile?.notificationSettings) {
      const ns = profile.notificationSettings;
      setSettings({
        twoFactorAuth: Boolean(
          ns.twoFactorAuth ?? DEFAULT_NOTIFICATION_SETTINGS.twoFactorAuth
        ),
        emailNotification: Boolean(
          ns.emailNotification ?? DEFAULT_NOTIFICATION_SETTINGS.emailNotification
        ),
        smsNotification: Boolean(
          ns.smsNotification ?? DEFAULT_NOTIFICATION_SETTINGS.smsNotification
        ),
        dashboardNotifications: Boolean(
          ns.dashboardNotifications ??
            DEFAULT_NOTIFICATION_SETTINGS.dashboardNotifications
        ),
        weeklyEmailReports: Boolean(
          ns.weeklyEmailReports ??
            DEFAULT_NOTIFICATION_SETTINGS.weeklyEmailReports
        ),
        systemAlerts: Boolean(
          ns.systemAlerts ?? DEFAULT_NOTIFICATION_SETTINGS.systemAlerts
        ),
        loginAlertsViaMail: Boolean(
          ns.loginAlertsViaMail ??
            DEFAULT_NOTIFICATION_SETTINGS.loginAlertsViaMail
        ),
      });
    }
  }, [profile]);

  const toggleSetting = (key: keyof NotificationSettings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSaveSettings = async () => {
    const payload: NotificationSettings = {
      twoFactorAuth: settings.twoFactorAuth,
      emailNotification: settings.emailNotification,
      smsNotification: settings.smsNotification,
      dashboardNotifications: settings.dashboardNotifications,
      weeklyEmailReports: settings.weeklyEmailReports,
      systemAlerts: settings.systemAlerts,
      loginAlertsViaMail: settings.loginAlertsViaMail,
    };

    const toastId = toast.loading("Saving settings...");
    try {
      await updateNotificationSettingsMutation.mutateAsync(payload);
      toast.success("Settings saved successfully", { id: toastId });
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to save settings"), {
        id: toastId,
      });
    }
  };

  const isSaving = updateNotificationSettingsMutation.isPending;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-wrap md:items-center items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-wrap">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium cursor-pointer"
          >
            <img src={backarrow} alt="Back" />
            <span className="font-normal md:text-sm text-xs">Back</span>
          </button>
          <div className="flex items-start gap-1 flex-col lg:max-w-3/6 max-w-auto">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight md:mb-2 mb-1">
              Settings
            </h1>
            <p className="text-sm text-gray-500 font-medium">
              Manage your account preferences and system configuration
            </p>
          </div>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={isSaving || isProfileLoading}
          className="md:px-4 ml-auto md:mt-0 mt-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg transition-opacity md:text-sm text-xs font-normal min-w-[128px] w-fit cursor-pointer flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            "Save All Settings"
          )}
        </button>
      </div>

      {isProfileLoading && (
        <div className="bg-white rounded-xl p-8 border border-gray-100 flex items-center justify-center gap-3 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-sm">Loading current settings...</span>
        </div>
      )}

      {profileError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          {getApiErrorMessage(profileError, "Could not load settings.")}
        </div>
      )}

      {/* Account Settings */}
      <h3 className="text-base font-bold text-gray-900 lg:my-1">
        Account & Security Settings
      </h3>
      <div className="bg-white lg:rounded-xl rounded-lg lg:p-6 p-3 border border-gray-100 space-y-6">
        {/* Two Factor Authentication */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">
              Two Factor Authentication (2FA)
            </h4>
            <p className="text-xs text-gray-500">
              Add an extra layer of security to your account
            </p>
          </div>
          <button
            type="button"
            onClick={() => toggleSetting("twoFactorAuth")}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
              settings.twoFactorAuth ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.twoFactorAuth ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Email Notifications */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">
              Email Notifications
            </h4>
            <p className="text-xs text-gray-500">
              Receive notifications via email
            </p>
          </div>
          <button
            type="button"
            onClick={() => toggleSetting("emailNotification")}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
              settings.emailNotification ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.emailNotification ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* SMS Notifications */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">
              SMS Notifications
            </h4>
            <p className="text-xs text-gray-500">
              Receive urgent dispatch and workflow alerts via SMS
            </p>
          </div>
          <button
            type="button"
            onClick={() => toggleSetting("smsNotification")}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
              settings.smsNotification ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.smsNotification ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Notification Settings */}
      <h3 className="text-base font-bold text-gray-900 lg:my-1">
        Notification Settings
      </h3>
      <div className="bg-white lg:rounded-xl rounded-lg lg:p-6 p-3 border border-gray-100 space-y-6">
        {/* Dashboard Notifications */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">
              Dashboard Notifications
            </h4>
            <p className="text-xs text-gray-500">
              Show real-time in-app dashboard notifications
            </p>
          </div>
          <button
            type="button"
            onClick={() => toggleSetting("dashboardNotifications")}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
              settings.dashboardNotifications ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.dashboardNotifications
                  ? "translate-x-6"
                  : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Weekly Email Reports */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">
              Weekly Email Reports
            </h4>
            <p className="text-xs text-gray-500">
              Receive weekly progress and task summaries via email
            </p>
          </div>
          <button
            type="button"
            onClick={() => toggleSetting("weeklyEmailReports")}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
              settings.weeklyEmailReports ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.weeklyEmailReports
                  ? "translate-x-6"
                  : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* System Alerts */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">
              System Alerts
            </h4>
            <p className="text-xs text-gray-500">
              Receive critical service status and security alerts
            </p>
          </div>
          <button
            type="button"
            onClick={() => toggleSetting("systemAlerts")}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
              settings.systemAlerts ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.systemAlerts ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Login Alerts via Mail */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">
              Login Alerts via Mail
            </h4>
            <p className="text-xs text-gray-500">
              Get notified by email whenever a new login or device registers
            </p>
          </div>
          <button
            type="button"
            onClick={() => toggleSetting("loginAlertsViaMail")}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
              settings.loginAlertsViaMail ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.loginAlertsViaMail
                  ? "translate-x-6"
                  : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
