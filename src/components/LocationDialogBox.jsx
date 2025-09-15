import { useFormik } from "formik";
import { useSnackbar } from "notistack";
import * as Yup from "yup";
import { useEffect } from "react";
import { usePostData } from "../hooks/usePostData";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/UI/dialog";
import { Label } from "../components/UI/label";
import { Input } from "../components/UI/input";
import { Button } from "../components/UI/button";

export default function LocationDialogBox({
  open,
  setOpen,
  selectedLocation,
  setSelectedLocation,
  setRefetch,
}) {
  const { enqueueSnackbar } = useSnackbar();

  const defaultCustodyLimits = [
    {
      custodyType: "remand_prisoner",
      spendLimit: "",
      depositLimit: "",
      purchaseStatus: "approved",
    },
    {
      custodyType: "under_trial",
      spendLimit: "",
      depositLimit: "",
      purchaseStatus: "approved",
    },
    {
      custodyType: "remand_of_court",
      spendLimit: "",
      depositLimit: "",
      purchaseStatus: "approved",
    },
  ];

  const formik = useFormik({
    initialValues: {
      locationName: "",
      custodyLimits: defaultCustodyLimits,
    },
    validationSchema: Yup.object({
      locationName: Yup.string().required("Location name is required"),
      custodyLimits: Yup.array().of(
        Yup.object({
          custodyType: Yup.string().required(),
          depositLimit: Yup.number()
            .typeError("Must be a number")
            .required("Deposit limit is required"),
          spendLimit: Yup.number()
            .typeError("Must be a number")
            .required("Spend limit is required"),
          purchaseStatus: Yup.string().required(),
        })
      ),
    }),
    onSubmit: async (values) => {
      const isEdit = Object.keys(selectedLocation ?? {}).length > 0;
      const url = isEdit
        ? `location/${selectedLocation._id}`
        : `location`;
      const method = isEdit ? "put" : "post";

      const { data, error } = await usePostData(url, values, method);

      if (error) {
        enqueueSnackbar(error?.response?.data?.message, { variant: "error" });
      } else {
        enqueueSnackbar(
          isEdit
            ? "Location updated successfully!"
            : "Location created successfully!",
          { variant: "success" }
        );
        setOpen(false);
        setSelectedLocation(null);
        setRefetch((prev) => prev + 1);
        formik.resetForm();
        localStorage.setItem("location", JSON.stringify(data?.data));
      }
    },
  });

  // ✅ Update form values safely when editing
  useEffect(() => {
    if (selectedLocation) {
      formik.setValues({
        locationName: selectedLocation?.locationName || "",
        custodyLimits: selectedLocation?.custodyLimits?.length
          ? selectedLocation.custodyLimits
          : defaultCustodyLimits,
      });
    }
  }, [selectedLocation]);

  const selectedLocationHaveValue =
    Object.keys(selectedLocation ?? {}).length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>
            {selectedLocationHaveValue ? "Edit Location" : "Add Location"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          {/* Location Name */}
          <div>
            <Label htmlFor="locationName" className="mb-2">
              Location Name
            </Label>
            <Input
              id="locationName"
              name="locationName"
              value={formik.values.locationName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.locationName &&
              formik.errors.locationName && (
                <p className="text-red-500 text-sm">
                  {formik.errors.locationName}
                </p>
              )}
          </div>

          {/* Remand Prisoner */}
          <div>
            <Label className="mb-2">Remand Prisoner</Label>
            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <Input
                  type="number"
                  placeholder="Deposit Limit"
                  name="custodyLimits[0].depositLimit"
                  value={formik.values.custodyLimits?.[0]?.depositLimit ?? ""}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.custodyLimits?.[0]?.depositLimit &&
                  formik.errors.custodyLimits?.[0]?.depositLimit && (
                    <p className="text-red-500 text-sm">
                      {formik.errors.custodyLimits[0].depositLimit}
                    </p>
                  )}
              </div>
              <div>
                <Input
                  type="number"
                  placeholder="Spend Limit"
                  name="custodyLimits[0].spendLimit"
                  value={formik.values.custodyLimits?.[0]?.spendLimit ?? ""}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.custodyLimits?.[0]?.spendLimit &&
                  formik.errors.custodyLimits?.[0]?.spendLimit && (
                    <p className="text-red-500 text-sm">
                      {formik.errors.custodyLimits[0].spendLimit}
                    </p>
                  )}
              </div>
            </div>
          </div>

          {/* Under Trial */}
          <div>
            <Label className="mb-2">Under Trial</Label>
            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <Input
                  type="number"
                  placeholder="Deposit Limit"
                  name="custodyLimits[1].depositLimit"
                  value={formik.values.custodyLimits?.[1]?.depositLimit ?? ""}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.custodyLimits?.[1]?.depositLimit &&
                  formik.errors.custodyLimits?.[1]?.depositLimit && (
                    <p className="text-red-500 text-sm">
                      {formik.errors.custodyLimits[1].depositLimit}
                    </p>
                  )}
              </div>
              <div>
                <Input
                  type="number"
                  placeholder="Spend Limit"
                  name="custodyLimits[1].spendLimit"
                  value={formik.values.custodyLimits?.[1]?.spendLimit ?? ""}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.custodyLimits?.[1]?.spendLimit &&
                  formik.errors.custodyLimits?.[1]?.spendLimit && (
                    <p className="text-red-500 text-sm">
                      {formik.errors.custodyLimits[1].spendLimit}
                    </p>
                  )}
              </div>
            </div>
          </div>

          {/* Remand of Court */}
          <div>
            <Label className="mb-2">Remand of Court</Label>
            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <Input
                  type="number"
                  placeholder="Deposit Limit"
                  name="custodyLimits[2].depositLimit"
                  value={formik.values.custodyLimits?.[2]?.depositLimit ?? ""}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.custodyLimits?.[2]?.depositLimit &&
                  formik.errors.custodyLimits?.[2]?.depositLimit && (
                    <p className="text-red-500 text-sm">
                      {formik.errors.custodyLimits[2].depositLimit}
                    </p>
                  )}
              </div>
              <div>
                <Input
                  type="number"
                  placeholder="Spend Limit"
                  name="custodyLimits[2].spendLimit"
                  value={formik.values.custodyLimits?.[2]?.spendLimit ?? ""}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.custodyLimits?.[2]?.spendLimit &&
                  formik.errors.custodyLimits?.[2]?.spendLimit && (
                    <p className="text-red-500 text-sm">
                      {formik.errors.custodyLimits[2].spendLimit}
                    </p>
                  )}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setSelectedLocation(null);
                formik.resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-500 text-white">
              {selectedLocationHaveValue ? "Update" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
