var totalAllCols = 0;
var totalAllColsBest = 0;
var totalAllColsAvg = 0;
var totalAllColsWorst = 0;
var estimateCaseArray = [];
var myChart;
var existingAnnualCost = "";
var amenityOptionsStartData = {
    "rentIncrease": {
        "occurPerMonth": [100,100,100],
        "revPerOccurs": [5,10,20],
        "productCase": "best",
    },
    "shortTermGuest": {
        "occurPerMonth": [5,10,25],
        "revPerOccurs": [10,10,15],
        "productCase": "average"
    },
    "longTermGuest": {
        "occurPerMonth": [2.5,5,15],
        "revPerOccurs": [20,20,25],
        "productCase": "worst"
    },
    "additionalAccessPasses": {
        "occurPerMonth": [15,25,40],
        "revPerOccurs": [10,20,30],
        "productCase": "worst"
    },
    "extendedGymHours": {
        "occurPerMonth": [5,10,20],
        "revPerOccurs": [5,5,5],
        "productCase": "worst"
    },
    "clubhouseCommonSpaceRental" : {
        "occurPerMonth": [1,2,4],
        "revPerOccurs": [25,25,25],
        "productCase": "average"
    },
    "businessOfficeRental": {
        "occurPerMonth": [1,2,4],
        "revPerOccurs": [20,20,20],
        "productCase": "worst"
    },
    "onSiteStorageRental": {
        "occurPerMonth": [1,2,4],
        "revPerOccurs": [100,100,100],
        "productCase": "worst"
    },
    "petWashingStation": {
        "occurPerMonth": [1,2,4],
        "revPerOccurs": [10,10,10],
        "productCase": "worst"
    },
    "guestParkingPass": {
        "occurPerMonth": [1,2,4],
        "revPerOccurs": [30,30,30],
        "productCase": "worst"
    },
    "generalServiceOfferingsOther": {
        "occurPerMonth": [1,1,1],
        "revPerOccurs": [5,5,5],
        "productCase": "worst"
    }
}

var checkId = ["rentIncrease", "shortTermGuest", "longTermGuest" ,"additionalAccessPasses"]

class CostAnalysisDashboard extends HTMLElement {
    constructor() {
      super();
    }

    numberWithCommas(number) {
        return number.toLocaleString('en-US');
    }
      
    showSelection(item) {
        var itemModal = this.querySelector('#'+(item.id)+'Modal');

        itemModal.style.display = "flex";
    }

    saveModalForm(form) {
        if (form.id == "unitLocksForm") {
            this.calculateUnitLocks();
            this.querySelector("#unitLocksModal").style.display = "none";
        } else if (form.id == "networkAccessForm") {
            this.calculateNetworkAccess();
            this.querySelector("#networkAccessModal").style.display = "none";
        } else if (form.id == "productSystemForm") {
            this.calculateProductSystem();
            this.querySelector("#productSystemModal").style.display = "none";
        }

        this.oldAnnualUnitTurnoverCount = "";
        this.oldstaffTurnoverCount = "";
        this.calculatedExistingAnnualCost(true);
    }

    getNumberApartments() {
        var numberApartments = this.querySelector('#numberApartments').value;
        return numberApartments;
    }

    calculateNetworkAccess() {
        var staffTurnoverCount = parseFloat(this.querySelector("#staffTurnoverCount").value);
        var staffTurnoverCost = parseFloat(this.querySelector("#staffTurnoverCost").value);
        var networkExistingAnnualLicensing = parseFloat(this.querySelector("#networkExistingAnnualLicensing").value);
        var networkExistingAnnualMiscExpense = parseFloat(this.querySelector("#networkExistingAnnualMiscExpense").value);

        var networkAccess = document.querySelector('#networkAccessCalculated');

        if (networkAccess) {
            if (this.fobRekeyCostOption.value === "staffAnnualCostOption") {
                this.networkAccessCost = (staffTurnoverCost) + networkExistingAnnualLicensing + networkExistingAnnualMiscExpense;
            } else {
                this.networkAccessCost = (staffTurnoverCount * staffTurnoverCost) + networkExistingAnnualLicensing + networkExistingAnnualMiscExpense;
            }
            networkAccess.innerHTML = `${this.numberWithCommas(this.networkAccessCost)}`;
        }

        this.costInputsData = JSON.parse(this.getSessionStorageData('costInputsData'));

        if (this.oldstaffTurnoverCount === null || this.oldstaffTurnoverCount === undefined || this.oldstaffTurnoverCount === "") {
            this.networkAccessInnerData = {
                "staffTurnoverCount": staffTurnoverCount,
                "staffTurnoverCost": staffTurnoverCost,
                "networkExistingAnnualLicensing": networkExistingAnnualLicensing,
                "networkExistingAnnualMiscExpense": networkExistingAnnualMiscExpense,
            }
        } else {
            this.networkAccessInnerData = {
                "staffTurnoverCount": parseFloat(this.oldstaffTurnoverCount),
                "staffTurnoverCost": staffTurnoverCost,
                "networkExistingAnnualLicensing": networkExistingAnnualLicensing,
                "networkExistingAnnualMiscExpense": networkExistingAnnualMiscExpense,
            }
        }

        this.costInputsData["networkAccess"] = this.networkAccessInnerData;

        this.setSessionStorageData('costInputsData', JSON.stringify(this.costInputsData));
    }

    calculateAnnualSavings() {
        var annualSavings = this.querySelector('#calculatedAnnualSavings');
        
        this.annualSavingsValue = this.existingAnnualCostValue - this.calculatedAnnualProductCost;

        if (this.annualSavingsValue < 0) {

            let element = document.querySelector("#calculatedAnnualSavings").parentNode; // replace "#myElement" with your actual selector

            for (let i = 0; i < element.childNodes.length; i++) {
                let node = element.childNodes[i];
                if (node.nodeType === 3) { // 3 represents a text node
                    node.nodeValue = "";
                }
            }

            annualSavings.textContent = `n/a`;
        } else {

            let element = document.querySelector("#calculatedAnnualSavings").parentNode; // replace "#myElement" with your actual selector

            for (let i = 0; i < element.childNodes.length; i++) {
                let node = element.childNodes[i];
                if (node.nodeType === 3) { // 3 represents a text node
                    node.nodeValue = "$";
                }
            }
            annualSavings.innerHTML = `${this.numberWithCommas(this.annualSavingsValue)}`;
        }
    }

    calculateBreakEvenPoint() {
        var breakEvenPoint = this.querySelector('#calculatedBreakevenPoint');
        var indexGreaterThanZero = estimateCaseArray.findIndex(value => value > 0) === -1 ? 0 : estimateCaseArray.findIndex(value => value > 0);

        breakEvenPoint.innerHTML = `${parseInt(indexGreaterThanZero)}`;
    }

    calculatedExistingAnnualCost(runGraph) {
        existingAnnualCost = this.querySelector('#calculatedExistingAnnualCost');

        this.existingAnnualCostValue = this.networkAccessCost + this.unitLocksCost;

        existingAnnualCost.innerHTML = `${this.numberWithCommas(this.existingAnnualCostValue)}`;

        this.calculateAnnualSavings();
        if (runGraph) {
            this.totalAllColsCalculate();
        }
    }

    calculateProductSystem() {
        var productInitialCost = parseFloat(this.querySelector("#productInitialCost").value);
        var productAnnualLicensing = parseFloat(this.querySelector("#productAnnualLicensing").value);
        var existingAnnualLicensingRemain = parseFloat(this.querySelector("#existingAnnualLicensingRemain").value);

        var productSystem = document.querySelector('#productSystemCalculated');
        var productSystemBody = document.querySelector('#calculatedAnnualProductCost');
    
        this.calculatedAnnualProductCost = productAnnualLicensing + existingAnnualLicensingRemain;

        if (productSystem) {
            productSystem.innerHTML = `${this.numberWithCommas(productInitialCost)} + $${((productAnnualLicensing + existingAnnualLicensingRemain)/12).toFixed(1)}/mo`;
            productSystemBody.innerHTML = `${this.numberWithCommas(this.calculatedAnnualProductCost)}`;
        }

        this.costInputsData = JSON.parse(this.getSessionStorageData('costInputsData'));

        this.productSystemInnerData = {
            "productInitialCost": productInitialCost,
            "productAnnualLicensing": productAnnualLicensing,
            "existingAnnualLicensingRemain": existingAnnualLicensingRemain,
        }

        this.costInputsData["productSystem"] = this.productSystemInnerData;

        this.setSessionStorageData('costInputsData', JSON.stringify(this.costInputsData));
    }

    calculateFobRekeyCostOption(value = false) {
        if (!value) {
            var value = this.fobRekeyCostOption.value;
        } else {
            this.fobRekeyCostOption.value = value;
        }

        var fobRekeyCostOptionList = {
            "fobRekeyOption": true,
            "annualCostOption": false,
        };
    
        if (fobRekeyCostOptionList[value]) {
            this.costInputsData = JSON.parse(this.getSessionStorageData('costInputsData'));
            this.fobRekeyCost.value = this.costInputsData["unitLocks"]["fobRekeyCost"];;
            this.annualUnitTurnoverCount.value = this.costInputsData["unitLocks"]["annualUnitTurnoverCount"];
            this.fobsPerUnit.value = this.costInputsData["unitLocks"]["fobsPerUnit"];
            this.oldAnnualUnitTurnoverCount = null;

            this.querySelector("#fobsPerUnitRow").style.display = 'flex';
            this.querySelector("#annualUnitTurnoverCountRow").style.display = 'flex';
        } else {
            this.fobsPerUnit.value = 1;
            this.oldAnnualUnitTurnoverCount = this.annualUnitTurnoverCount.value;
            this.annualUnitTurnoverCount.value = 100;

            this.querySelector("#fobsPerUnitRow").style.display = 'none';
            this.querySelector("#annualUnitTurnoverCountRow").style.display = 'none';
        }
    }

    calculateStaffTurnoverCostOption(value = false) {
        if (!value) {
            var value = this.staffTurnoverCostOption.value;
        } else {
            this.staffTurnoverCostOption.value = value;
        }
    
        var staffTurnoverCostOptionList = {
            "staffTurnoverOption": true,
            "staffAnnualCostOption": false,
        };
    
        if (staffTurnoverCostOptionList[value]) {
            this.costInputsData = JSON.parse(this.getSessionStorageData('costInputsData'));
            this.staffTurnoverCost.value = this.costInputsData["networkAccess"]["staffTurnoverCost"];
            this.staffTurnoverCount.value = this.costInputsData["networkAccess"]["staffTurnoverCount"];
            this.oldstaffTurnoverCount = null;

            this.querySelector("#staffTurnoverCountRow").style.display = 'flex';

        } else {
            this.oldstaffTurnoverCount = this.staffTurnoverCount.value;
            this.staffTurnoverCount.value = 1;

            this.querySelector("#staffTurnoverCountRow").style.display = 'none';
        }
    }

    calculateUnitLocks() {
        var numberApartments = parseInt(this.getNumberApartments());
        this.querySelector('#numApartments').innerHTML = `${numberApartments}`;

        this.getSessionStorageData('amenitysData') ? this.amenitysData = JSON.parse(this.getSessionStorageData('amenitysData')) : this.amenitysData = "";

        checkId.forEach(key => {
            if (this.amenitysData[key]) {
                var el = this.querySelector("form-section#" + key);

                var newEl = el.cloneNode(true);
    
                this.showSelectionAmenity(newEl, false, false);
    
                this.amenitysData = JSON.parse(this.getSessionStorageData('amenitysData'));
    
                newEl.setAttribute("costinfo",parseFloat(this.amenitysData[key]["productEstimate"]));
    
                el.replaceWith(newEl);
            } else {
                var el = this.querySelector("form-section#" + key);

                var newEl = el.cloneNode(true);
            
                newEl.setAttribute("costinfo",parseFloat(newEl.getAttribute("costinfo") * numberApartments));
    
                el.replaceWith(newEl);
            }
        });

        var existingFobRekeyCostPerUser = parseFloat(this.querySelector("#fobRekeyCost").value)/100;
        var annualUnitTurnoverCount = parseFloat(this.querySelector("#annualUnitTurnoverCount").value);
        var fobsPerUnit = parseFloat(this.querySelector("#fobsPerUnit").value);
        var existingAnnualLicensing = parseFloat(this.querySelector("#existingAnnualLicensing").value);
        var existingAnnualMiscExpense = parseFloat(this.querySelector("#existingAnnualMiscExpense").value);

        var unitLocks = document.querySelector('#unitLocksCalculated');

        if (unitLocks) {
            if (this.fobRekeyCostOption.value === "annualCostOption") {
                this.unitLocksCost = (numberApartments * (existingFobRekeyCostPerUser*100)  * fobsPerUnit) + existingAnnualLicensing + existingAnnualMiscExpense;
            } else {
                this.unitLocksCost = (numberApartments * existingFobRekeyCostPerUser * annualUnitTurnoverCount * fobsPerUnit) + existingAnnualLicensing + existingAnnualMiscExpense;
            }
            unitLocks.innerHTML = `${this.numberWithCommas(this.unitLocksCost)}`;
        }

        this.costInputsData = JSON.parse(this.getSessionStorageData('costInputsData'))

        if (this.oldAnnualUnitTurnoverCount === null || this.oldAnnualUnitTurnoverCount === undefined || this.oldAnnualUnitTurnoverCount === "") {
            this.unitLocksInnerData = {
                "numberApartments": numberApartments,
                "fobRekeyCost": existingFobRekeyCostPerUser*100,
                "annualUnitTurnoverCount": annualUnitTurnoverCount,
                "fobsPerUnit": fobsPerUnit,
                "existingAnnualLicensing": existingAnnualLicensing,
                "existingAnnualMiscExpense": existingAnnualMiscExpense,
            }
        } else {
            this.unitLocksInnerData = {
                "numberApartments": numberApartments,
                "fobRekeyCost": existingFobRekeyCostPerUser*100,
                "annualUnitTurnoverCount": parseFloat(this.oldAnnualUnitTurnoverCount),
                "fobsPerUnit": fobsPerUnit,
                "existingAnnualLicensing": existingAnnualLicensing,
                "existingAnnualMiscExpense": existingAnnualMiscExpense,
            }
        }


        this.costInputsData["unitLocks"] = this.unitLocksInnerData;

        this.setSessionStorageData('costInputsData', JSON.stringify(this.costInputsData));
    }

    totalAllColsCalculate() {
        this.getSessionStorageData('amenitysData') ? this.amenitysData = JSON.parse(this.getSessionStorageData('amenitysData')) : this.amenitysData = "";
    
        totalAllColsWorst = 0;
        totalAllColsAvg = 0;
        totalAllColsBest = 0;
        totalAllCols = 0;

        if (this.amenitysData) {
            Object.keys(this.amenitysData).forEach(key => {
                totalAllColsWorst += parseFloat(this.amenitysData[key]["annualRevenueWorst"]);
                totalAllColsAvg += parseFloat(this.amenitysData[key]["annualRevenueAvg"]);
                totalAllColsBest += parseFloat(this.amenitysData[key]["annualRevenueBest"]);
                totalAllCols += parseFloat(this.amenitysData[key]["productEstimate"]*12);
            });
        }

        if (totalAllCols > 0) {
            startGraph();
            this.querySelector('analysis-table').calculateDasboardTable();
            this.calculateBreakEvenPoint();
        } else {
            if (myChart) {
                myChart.destroy();
            }
            this.querySelector('analysis-table').calculateDasboardTable();
        }
    }

    showSelectionAmenity(item, showModal = true, updateModal = true) {
        var itemModal = this.querySelector('#amenityModal');

        if (updateModal) {
            itemModal.style.display = "flex";
        }

        if (this.getSessionStorageData('amenitysData')) {
            this.amenitysData = JSON.parse(this.getSessionStorageData('amenitysData'))
        } else {
            this.amenitysData = '';
        }

        if (showModal) {
            this.querySelector('#amenityModalTitle').innerHTML = `${(item.querySelector('.form-title')).textContent}`;
            this.querySelector('#amenityModalForm').innerHTML = `<amenity-details id="${item.id}" class="w-full h-full flex flex-col text-md lg:text-2xl" title="${(item.querySelector('.form-title')).textContent}" occurPerMonth="${this.amenitysData[item.id] ? (this.amenitysData[item.id]["occurPerMonth"]).map((value) => `${value}`) : (amenityOptionsStartData[item.id]["occurPerMonth"]).map((value) => `${value}`)}" revPerOccur="${this.amenitysData[item.id]  ? (this.amenitysData[item.id]["revPerOccurs"]).map((value) => `${value}`) : (amenityOptionsStartData[item.id]["revPerOccurs"]).map((value) => `${value}`)}" productCase="${this.amenitysData[item.id]  ? this.amenitysData[item.id]["productCase"] : amenityOptionsStartData[item.id]["productCase"]}" ${checkId.includes(item.id) ? "" : " alternate='true'"}></amenity-details>`;
        } else {
            this.querySelector('#amenityModalTitle').innerHTML = ``;
            this.querySelector('#amenityModalForm').innerHTML = `<amenity-details id="${item.id}" class="w-full h-full flex flex-col text-md lg:text-2xl" title="" occurPerMonth="${this.amenitysData[item.id] ? (this.amenitysData[item.id]["occurPerMonth"]).map((value) => `${value}`) : (amenityOptionsStartData[item.id]["occurPerMonth"]).map((value) => `${value}`)}" revPerOccur="${this.amenitysData[item.id]  ? (this.amenitysData[item.id]["revPerOccurs"]).map((value) => `${value}`) : (amenityOptionsStartData[item.id]["revPerOccurs"]).map((value) => `${value}`)}" productCase="${this.amenitysData[item.id]  ? this.amenitysData[item.id]["productCase"] : amenityOptionsStartData[item.id]["productCase"]}" ${checkId.includes(item.id) ? "" : " alternate='true'"}></amenity-details>`;
        }
    }

    saveAmenityFormPromise() {
        return new Promise(resolve => {
            var saveButton = document.querySelector('amenity-details #saveAmenityForm');
            var cancelButton = document.querySelector('amenity-details #closeAmenityForm');
            var closeButton = document.querySelector('#amenityModal .closeModal');

            cancelButton.addEventListener('click', () => {
                resolve();
            });

            closeButton.addEventListener('click', () => {
                resolve();
            });

            saveButton.addEventListener('click', () => {        
                resolve();
            });
        });
    }

    showAmenityOptions() {
        var addAmenityModal = this.querySelector('#addAmenityModal');

        addAmenityModal.style.display = "flex";
    }

    cancelAmenityOptions() {
        var addAmenityModal = this.querySelector('#addAmenityModal');

        this.amenityOptionsData = this.getSessionStorageData('amenityOptionsData');

        var checkboxes = document.querySelectorAll('#amenityCheckboxForm input[type="checkbox"]');

        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });

        if (this.amenityOptionsData) {
            this.amenityOptionsData = JSON.parse(this.amenityOptionsData);
        
            this.amenityOptionsData.forEach(amenity => {
                var resetAmenityModal = this.querySelector('[value="'+amenity+'"]');
                resetAmenityModal.checked = true;
            });
        }

        addAmenityModal.style.display = "none";
    }

    selectAllAmenity(checked) {
        if (checked) {
            var checkboxes = document.querySelectorAll('#amenityCheckboxForm input[type="checkbox"]');
            
            checkboxes.forEach(checkbox => {
                checkbox.checked = true;
            });
        } else {
            var checkboxes = document.querySelectorAll('#amenityCheckboxForm input[type="checkbox"]');
            
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
        }
    } 

    async saveAmenitySelections(logic = true, update = false) {
        var checkedCheckboxes = [];
        var storeAmenitySelections = [];
        var checkboxes = document.querySelectorAll('#amenityCheckboxForm input[type="checkbox"]');
        var addAmenityModal = this.querySelector('#addAmenityModal');

        this.getSessionStorageData('amenitysData') ? this.amenitysData = JSON.parse(this.getSessionStorageData('amenitysData')) : this.amenitysData = '';

        checkboxes.forEach(checkbox => {
            var amenityVal = checkbox.value;

            var amenityContainer = this.querySelector('#'+amenityVal);

            if (checkbox.checked) {
                checkedCheckboxes.push(checkbox);
            } else {
                amenityContainer.style.display = "none";
            }
        });

        await (async () => { 
            for (const checkedCheckbox of checkedCheckboxes) {
                var amenityVal = checkedCheckbox.value;

                storeAmenitySelections.push(amenityVal);
            
                var amenityContainer = this.querySelector('#'+amenityVal);
            
                amenityContainer.style.display = "flex";
                addAmenityModal.style.display = "none";

                if (update) {
                    this.showSelectionAmenity(amenityContainer, false, false);
                } else {
                    if (!this.amenitysData[amenityVal]) {
                        this.showSelectionAmenity(amenityContainer, true);
                        await this.saveAmenityFormPromise();
                    } else {
                        this.showSelectionAmenity(amenityContainer, true, false);
                    }
                }
            }
        })();

        addAmenityModal.style.display = "none";

        this.getSessionStorageData('amenitysData') ? this.amenitysData = JSON.parse(this.getSessionStorageData('amenitysData')) : this.amenitysData = '';
        
        if (storeAmenitySelections.length === this.querySelectorAll("#amenityCheckboxForm > div").length) {
            var selectAll = this.querySelector('#selectAllAmenity');
            selectAll.checked = true;
        } else {
            var selectAll = this.querySelector('#selectAllAmenity');
            selectAll.checked = false;
        }

        Object.keys(this.amenitysData).forEach(key => {
            if (!storeAmenitySelections.includes(key)) {
                delete this.amenitysData[key];
            }
        });
    
        this.setSessionStorageData('amenitysData', JSON.stringify(this.amenitysData));

        this.setSessionStorageData('amenityOptionsData', JSON.stringify(storeAmenitySelections));

        if (logic) {
            this.totalAllColsCalculate();
        }
    }

    updateAmenityCheckbox(item) {
        if (Array.isArray(item)) {
            this.amenityOptionsData = JSON.parse(this.getSessionStorageData('amenityOptionsData'))

            if (this.amenityOptionsData[0] != null) {
                item.forEach(amenity => {
                    var showAmenityModal = this.querySelector('[value="'+amenity+'"]');
                    showAmenityModal.checked = true;
                });
            }

            if (item.length === this.querySelectorAll("#amenityCheckboxForm > div").length) {
                var selectAll = this.querySelector('#selectAllAmenity');
                selectAll.checked = true;
            } else {
                var selectAll = this.querySelector('#selectAllAmenity');
                selectAll.checked = false;
            }
        } else {
            var showAmenityModal = this.querySelector('[value="'+item+'"]');
            showAmenityModal.checked = false;
            
            this.amenitysData = JSON.parse(this.getSessionStorageData('amenitysData'))
            this.amenityOptionsData = JSON.parse(this.getSessionStorageData('amenityOptionsData'))

            delete this.amenitysData[item];
            delete this.amenityOptionsData[this.amenityOptionsData.indexOf(item)];

            this.setSessionStorageData('amenitysData', JSON.stringify(this.amenitysData));

            this.saveAmenitySelections(true, true);

            var selectAll = this.querySelector('#selectAllAmenity');
            selectAll.checked = false;
        }
    }

    updateAnnualUnitTurnoverRate(item) {
        var annualUnitTurnoverRate = this.querySelector('#annualUnitTurnoverCount');
        
        if (item) {
            annualUnitTurnoverRate.value = item;
        }
    }

    updatePropertyType(item = '') {
        var propertyType = this.querySelector('#propertyType');
        
        if (item) {
            propertyType.value = item;
        }

        var UnitTurnoverCountList = {
            "propTypeMultiFamily": 46.8,
            "propTypeSeniorLiving": 47.5,
            "propTypeStudentHousing": 60,
            "propTypeAffordable": 39
        };

        this.updateAnnualUnitTurnoverRate(UnitTurnoverCountList[propertyType.value]);

        this.setSessionStorageData('propertyTypeData', JSON.stringify(propertyType.value));

        if (!item) {
            this.calculateUnitLocks();
            this.calculatedExistingAnnualCost(true);
        }
    }

    cancelModalForm(modal) {
        this.costInputsData = JSON.parse(this.getSessionStorageData('costInputsData'));

        if (modal.id === "unitLocksModalCancel") {
            Object.keys(this.costInputsData["unitLocks"]).forEach(key => {
                this.querySelector("#" + key).value = this.costInputsData["unitLocks"][key];
            });
            if (this.oldAnnualUnitTurnoverCount === null) {
                this.calculateFobRekeyCostOption("annualCostOption");
            } else if (this.oldAnnualUnitTurnoverCount != "") {
                this.calculateFobRekeyCostOption("fobRekeyOption");
            }
            this.querySelector("#unitLocksModal").style.display = "none";
        } else if (modal.id === "networkAccessModalCancel") {
            Object.keys(this.costInputsData["networkAccess"]).forEach(key => {
                this.querySelector("#" + key).value = this.costInputsData["networkAccess"][key];
            });
            if (this.oldstaffTurnoverCount === null) {
                this.calculateStaffTurnoverCostOption("staffAnnualCostOption");
            } else if (this.oldstaffTurnoverCount != "") {
                this.calculateStaffTurnoverCostOption("staffTurnoverOption");
            }
            this.querySelector("#networkAccessModal").style.display = "none";
        } else if (modal.id === "productSystemModalCancel") {
            Object.keys(this.costInputsData["productSystem"]).forEach(key => {
                this.querySelector("#" + key).value = this.costInputsData["productSystem"][key];
            });
            this.querySelector("#productSystemModal").style.display = "none";
        }

        // this.oldAnnualUnitTurnoverCount = "";
    }

    setSessionStorageData(key, value) {
        sessionStorage.setItem(key, value);
    }

    getSessionStorageData(key) {
        return sessionStorage.getItem(key);
    }

    connectedCallback() {

        this.getSessionStorageData('costInputsData') ? this.costInputsData = JSON.parse(this.getSessionStorageData('costInputsData')) : this.costInputsData = 0;
        this.getSessionStorageData('amenitysData') ? this.amenitysData = JSON.parse(this.getSessionStorageData('amenitysData')) : this.amenitysData = 0;

        this.innerHTML = `
            <div id="dashboardContainer" class="flex flex-col lg:flex-row w-full h-[150vh] lg:h-screen">
                <div id="dashboardSidebar" class="flex flex-col justify-start items-center h-[65vh] lg:h-full w-full lg:w-[30%] lg:max-w-[500px] lg:min-w-[300px] bg-neutral-100">
                    <div class="flex flex-col w-[85%]">
                        <div class="flex justify-start text-3xl font-bold uppercase py-4">Product Explorer</div>
                        <div class="flex flex-col gap-2">
                            <div class="text-lg">Property Type</div>
                            <select id="propertyType" class="text-lg border-black border-2">
                                <option value="propTypeMultiFamily" selected>Multi-Family</option>
                                <option value="propTypeSeniorLiving">Senior Living</option>
                                <option value="propTypeStudentHousing">Student Housing</option>
                                <option value="propTypeAffordable">Affordable</option>
                            </select>
                            <div class="flex flex-row items-center">
                                <input class="w-[10%]" id="property" type="number" value="7">
                                <span>%</span>
                                <div class="flex items-center justify-center text-xs md:text-lg ml-2 grow w-[90%]">Weighted Average Cost of Capital (WACC)</div>
                            </div>
                        </div>
                        <div id="costInputSection" class="flex flex-col items-center gap-2 mt-2">
                            <form-section id="unitLocks" formType="normal" class="flex flex-col justify-center bg-neutral-200 w-full p-2 gap-2" formTitle="Unit Locks" numApts="${this.costInputsData ? this.costInputsData["unitLocks"]["numberApartments"] : "1"}" value=""></form-section>
                            <form-section id="networkAccess" formType="normal" class="flex flex-col justify-center bg-neutral-200 w-full p-2 gap-2" formTitle="Network Access" value="0"></form-section>
                            <form-section id="productSystem" formType="normal" class="flex flex-col justify-center bg-neutral-200 w-full p-2 gap-2" formTitle="Product System"></form-section>
                        </div>
                        <div id="amenitiesSection">
                            <div class="flex flex-row justify-between items-center gap-2">
                                <div class="text-base">Amenities</div>
                                <div class="border-[1px] w-full"></div>
                                <button id="addAmenity" class="flex items-center justify-center w-[40px] h-[40px] text-[25px]">+</button>
                            </div>
                            <div id="amenitiesContainer" class="flex flex-col items-center gap-2">
                                <form-section id="rentIncrease" formType="amenity" class="flex flex-col justify-center border bg-neutral-200 w-full p-2 hidden gap-2" costInfo="${this.amenitysData["rentIncrease"] ? this.amenitysData["rentIncrease"]["productEstimate"] : "20"}" formTitle="Rent Increase"></form-section>
                                <form-section id="shortTermGuest" formType="amenity" class="flex flex-col justify-center bg-neutral-200 w-full p-2 gap-2 hidden" costInfo="${this.amenitysData["shortTermGuest"] ? this.amenitysData["shortTermGuest"]["productEstimate"] : "1"}" formTitle="Short Term Guest"></form-section>
                                <form-section id="longTermGuest" formType="amenity" class="flex flex-col justify-center border bg-neutral-200 w-full p-2 hidden gap-2" costInfo="${this.amenitysData["longTermGuest"] ? this.amenitysData["longTermGuest"]["productEstimate"] : "0.5"}" formTitle="Long Term Guest"></form-section>
                                <form-section id="additionalAccessPasses" formType="amenity" class="flex flex-col justify-center bg-neutral-200 w-full p-2 gap-2 hidden" costInfo="${this.amenitysData["additionalAccessPasses"] ? this.amenitysData["additionalAccessPasses"]["productEstimate"] : "1.5"}" formTitle="Additional Access Passes" alternate="true"></form-section>
                                <form-section id="extendedGymHours" formType="amenity" class="flex flex-col justify-center border bg-neutral-200 w-full p-2 hidden gap-2" costInfo="${this.amenitysData["extendedGymHours"] ? this.amenitysData["extendedGymHours"]["productEstimate"] : "25"}" formTitle="Extended Gym Hours" alternate="true"></form-section>
                                <form-section id="clubhouseCommonSpaceRental" formType="amenity" class="flex flex-col justify-center border bg-neutral-200 w-full p-2 hidden gap-2" costInfo="${this.amenitysData["clubhouseCommonSpaceRental"] ? this.amenitysData["clubhouseCommonSpaceRental"]["productEstimate"] : "25"}" formTitle="Clubhouse/Common Space Rental" alternate="true"></form-section>
                                <form-section id="businessOfficeRental" formType="amenity" class="flex flex-col justify-center bg-neutral-200 w-full p-2 gap-2 hidden" costInfo="${this.amenitysData["businessOfficeRental"] ? this.amenitysData["businessOfficeRental"]["productEstimate"] : "20"}" formTitle="Business Office Rental" alternate="true"></form-section>
                                <form-section id="onSiteStorageRental" formType="amenity" class="flex flex-col justify-center border bg-neutral-200 w-full p-2 hidden gap-2" costInfo="${this.amenitysData["onSiteStorageRental"] ? this.amenitysData["onSiteStorageRental"]["productEstimate"] : "100"}" formTitle="On-Site Storage Rental" alternate="true"></form-section>
                                <form-section id="petWashingStation" formType="amenity" class="flex flex-col justify-center bg-neutral-200 w-full p-2 gap-2 hidden" costInfo="${this.amenitysData["petWashingStation"] ? this.amenitysData["petWashingStation"]["productEstimate"] : "10"}" formTitle="Pet Washing Station" alternate="true"></form-section>
                                <form-section id="guestParkingPass" formType="amenity" class="flex flex-col justify-center border bg-neutral-200 w-full p-2 hidden gap-2" costInfo="${this.amenitysData["guestParkingPass"] ? this.amenitysData["guestParkingPass"]["productEstimate"] : "30"}" formTitle="Guest Parking Pass" alternate="true"></form-section>
                                <form-section id="generalServiceOfferingsOther" formType="amenity" class="flex flex-col justify-center bg-neutral-200 w-full p-2 gap-2 hidden" costInfo="${this.amenitysData["generalServiceOfferingsOther"] ? this.amenitysData["generalServiceOfferingsOther"]["productEstimate"] : "5"}" formTitle="General Service Offerings/Other" alternate="true"></form-section>
                            </div>
                        </div>
                        <button id="callInner" style="display:none;">Call inner function</button>
                    </div>
                </div>
                <div id="dashboardContent" class="flex flex-col grow p-4 items-center w-full lg:h-[inherit] lg:w-[75%] overflow-x-scroll h-[100vh] lg:h-full">
                    <div id="dashboardHeader" class="flex flex-row w-full gap-4 justify-evenly">
                        <div class="flex flex-col grow justify-between md:items-center border-2 bg-neutral-200 min-w-[60px] w-full">
                            <div class="flex justify-center text-center">Existing Annual Cost</div>
                            <div class="flex justify-center text-2xl font-bold">$<span id="calculatedExistingAnnualCost">0</span></div>
                        </div>
                        <div class="flex flex-col grow justify-between md:items-center border-2 bg-neutral-200 min-w-[60px] w-full">
                            <div class="flex justify-center text-center">Annual Cost With Product</div>
                            <div class="flex justify-center text-2xl font-bold">$<span id="calculatedAnnualProductCost">0</span></div>
                        </div>
                        <div class="flex flex-col grow justify-between md:items-center border-2 bg-neutral-200 min-w-[60px] w-full">
                            <div class="flex justify-center text-center">Annual Savings</div>
                            <div class="flex justify-center text-2xl font-bold">$<span id="calculatedAnnualSavings">0</span></div>
                        </div>
                        <div class="flex flex-col grow justify-between md:items-center border-2 bg-neutral-200 min-w-[60px] w-full">
                            <div class="flex justify-center text-center">BreakEven Point</div>
                            <div class="flex justify-center text-2xl font-bold"><span id="calculatedBreakevenPoint">0</span>&nbsp;mo.</div> 
                        </div>
                    </div>
                    <div class="relative w-full h-[inherit] min-h-[500px]">
                        <div id="dashboardBody" class="flex h-full max-w-full w-full absolute left-0 lg:justify-center min-w-[1000px] min-h-[500px] lg:min-w-[auto] items-center">
                            <canvas id="analysisOverviewChart"></canvas>
                        </div>
                    </div>
                    <analysis-table class="flex flex-row w-full gap-4 justify-start lg:justify-center max-w-[1000px]"></analysis-table>
                </div>
            </div>

            <div id="addAmenityModal" class="modal flex justify-center items-center">
                <div class="flex flex-col modal-content gap-2 bg-[#fefefe] w-[90%] h-[50%] lg:w-[40%] lg:h-[40%] p-2">
                    <div class="flex flex-row justify-between items-center text-3xl">
                        <div>Manage Amenities</div>
                        <div class="flex items-center text-2xl gap-2 w-[20%] ml-auto"><input id="selectAllAmenity" type="checkbox" class="w-[20%] h-[20px]" value="selectAllAmenity"> Select All</div>
                        <button class="closeAddAmenityModal close">&times;</button>
                    </div>
                    <div id="amenityCheckboxForm" class="flex flex-col border-2 overflow-auto gap-2 text-2xl">
                        <div class="flex items-center"><input type="checkbox" class="w-[10%] h-[90%]" value="rentIncrease"> Rent Increase</div>
                        <div class="flex items-center"><input type="checkbox" class="w-[10%] h-[90%]" value="shortTermGuest"> Short Term Guest (0-2 days)</div>
                        <div class="flex items-center"><input type="checkbox" class="w-[10%] h-[90%]" value="longTermGuest"> Long Term Guest (3+ Days)</div>
                        <div class="flex items-center"><input type="checkbox" class="w-[10%] h-[90%]" value="additionalAccessPasses"> Additional Access Passes</div>
                        <div class="flex items-center"><input type="checkbox" class="w-[10%] h-[90%]" value="extendedGymHours"> Extended Gym Hours</div>
                        <div class="flex items-center"><input type="checkbox" class="w-[10%] h-[90%]" value="clubhouseCommonSpaceRental"> Clubhouse/Common Space Rental</div>
                        <div class="flex items-center"><input type="checkbox" class="w-[10%] h-[90%]" value="businessOfficeRental"> Business Office Rental</div>
                        <div class="flex items-center"><input type="checkbox" class="w-[10%] h-[90%]" value="onSiteStorageRental"> On-Site Storage Rental</div>
                        <div class="flex items-center"><input type="checkbox" class="w-[10%] h-[90%]" value="petWashingStation"> Pet Washing Station</div>
                        <div class="flex items-center"><input type="checkbox" class="w-[10%] h-[90%]" value="guestParkingPass"> Guest Parking Pass</div>
                        <div class="flex items-center"><input type="checkbox" class="w-[10%] h-[90%]" value="generalServiceOfferingsOther"> General Service Offerings/Other</div>
                    </div>
                    <div class="flex flex-row justify-end grow items-center gap-2 text-2xl">
                        <button id="saveAmenitySelections" class="w-fit border-2 p-2">Save</button>
                        <button class="closeAddAmenityModal w-fit border-2 p-2">Cancel</button>
                    </div>
                </div>
            </div>

            <div id="unitLocksModal" class="modal flex justify-center items-center">
                <div class="flex flex-col modal-content gap-2 bg-[#fefefe] w-[90%] h-auto lg:w-auto p-2">
                    <div class="flex flex-row justify-between">
                        <div class="text-3xl font-bold">Unit Locks</div>
                        <button id="unitLocksModalCancel" class="closeModal close">&times;</button>
                    </div>
                    <form id="unitLocksForm" class="modalForm flex flex-col border-t-2 p-4 overflow-auto gap-2 text-base md:text-md lg:text-2xl h-full">
                        <li id="numberApartmentsRow" class="flex items-center justify-between px-4 relative flex-col md:flex-row"">
                            <label for="numberApartments">Number of Apartments</label>
                            <div>
                                <input class="my-0.5" type="number" required min="1" type="number" id="numberApartments" value="${this.costInputsData ? this.costInputsData["unitLocks"]["numberApartments"] : "1"}">
                            </div>
                        </li>
                        <li id="fobRekeyCostOptionRow" class="flex items-center justify-between px-4 relative flex-col md:flex-row" class="dependent-annual-service-cost">
                            <label for="fobRekeyCost">
                            <select id="fobRekeyCostOption" class="border-black	border-2">
                                <option value="fobRekeyOption" selected>Existing Fob or Rekey Cost per user</option>
                                <option value="annualCostOption">Annual Cost</option>
                            </select>
                            </label>
                            <div>
                                <span class="ml-auto">$</span>
                                <input class="my-0.5" type="number" min="0" id="fobRekeyCost" value="${this.costInputsData ? this.costInputsData["unitLocks"]["fobRekeyCost"] : "100"}">
                            </div>
                        </li>
                        <li id="annualUnitTurnoverCountRow" class="flex items-center justify-between px-4 relative flex-col md:flex-row"" class="dependent-annual-service-cost">
                            <label for="annualUnitTurnoverCount">Annual Unit Turnover Rate</label>
                            <div>
                                <input class="my-0.5" type="number" step="0.01" min="0" max="100" id="annualUnitTurnoverCount" value="${this.costInputsData ? this.costInputsData["unitLocks"]["annualUnitTurnoverCount"] : "46.8"}"></input>
                                <span class="w-[15px]">%</span>
                            </div>
                        </li>
                        <li id="fobsPerUnitRow" class="flex items-center justify-between px-4 relative flex-col md:flex-row"">
                            <label for="fobsPerUnit">Fobs per Unit (or Tenants per unit)</label>
                            <div>
                                <input class="my-0.5" type="number" min="0" step="0.01" id="fobsPerUnit" value="${this.costInputsData ? this.costInputsData["unitLocks"]["fobsPerUnit"] : "1.8"}"></input>
                            </div>
                        </li>
                        <li id="existingAnnualLicensingRow" class="flex items-center justify-between px-4 relative flex-col md:flex-row"">
                            <label for="existingAnnualLicensing">Existing Annual Licensing</label>
                            <div>
                                <span class="ml-auto">$</span>
                                <input class="my-0.5" type="number" min="0" id="existingAnnualLicensing" value="${this.costInputsData ? this.costInputsData["unitLocks"]["existingAnnualLicensing"] : "0"}"></input>
                            </div>
                        </li>
                        <li id="existingAnnualMiscExpenseRow" class="flex items-center justify-between px-4 relative flex-col md:flex-row"">
                            <label for="existingAnnualMiscExpense">Existing Annual Misc Expense</label>
                            <div>
                                <span class="ml-auto">$</span>
                                <input class="my-0.5" type="number" min="0" id="existingAnnualMiscExpense" value="${this.costInputsData ? this.costInputsData["unitLocks"]["existingAnnualMiscExpense"] : "0"}"></input>
                            </div>
                        </li>
                        <div class="flex flex-row justify-center grow items-center gap-2 my-8">
                            <button type="submit" id="unitLocksModalSave" class="saveModalForm w-fit border-2 p-2">Save</button>
                            <button id="unitLocksModalCancel" class="closeModal w-fit border-2 p-2">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
            

            <div id="networkAccessModal" class="modal flex justify-center items-center">
                <div class="flex flex-col modal-content gap-2 bg-[#fefefe] w-[90%] h-auto lg:w-auto p-2">
                    <div class="flex flex-row justify-between">
                        <div class="text-3xl font-bold">Network Access Control</div>
                        <button id="networkAccessModalCancel" class="closeModal close">&times;</button>
                    </div>
                    <form id="networkAccessForm" class="modalForm flex flex-col border-t-2 p-4 overflow-auto gap-2 text-base md:text-md lg:text-2xl h-full">
                        <li id="staffTurnoverCountRow" class="flex items-center justify-between px-4 relative flex-col md:flex-row"">
                            <label for="staffTurnoverCount">Staff Turnover Count</label>
                            <input class="my-0.5" type="number" min="0" id="staffTurnoverCount" value="${this.costInputsData ? this.costInputsData["networkAccess"]["staffTurnoverCount"] : "1"}"></input>
                        </li>
                        <li id="staffTurnoverCostOptionRow" class="flex items-center justify-between px-4 relative flex-col md:flex-row"">
                            <label for="staffTurnoverCost">
                                <select id="staffTurnoverCostOption" class="border-black border-2">
                                    <option value="staffTurnoverOption" selected>Staff Turnover Cost (Rekey/fob)</option>
                                    <option value="staffAnnualCostOption">Annual Cost</option>
                                </select>
                            </label>
                            <div>
                                <span class="ml-auto">$</span>
                                <input class="my-0.5" type="number" min="0" id="staffTurnoverCost" value="${this.costInputsData ? this.costInputsData["networkAccess"]["staffTurnoverCost"] : "100"}"></input>
                            </div>
                        </li>
                        <li id="networkExistingAnnualLicensingRow" class="flex items-center justify-between px-4 flex-col md:flex-row"">
                            <label class="flex flex-row  min-h-fit lg:h-[26px] justify-center items-center gap-1" for="networkExistingAnnualLicensing">
                                <div class="h-full">Existing Annual Licensing</div>
                                <div class="input-wrapper hidden md:flex items-center h-full relative">
                                    <img class="input-image  min-h-[25px] min-w-[25px] h-[25px] w-[25px]" src="./icons/question-mark-circle-icon.svg">
                                    <div class="input-description absolute top-0 text-base border-2 invisible opacity-0 bg-white h-full flex items-center justify-center left-[100%] top-0 w-max">** Current system annual license</div>
                                </div>
                            </label>
                            <div>
                                <span class="ml-auto">$</span>
                                <input class="my-0.5" type="number" min="0" id="networkExistingAnnualLicensing" value="${this.costInputsData ? this.costInputsData["networkAccess"]["networkExistingAnnualLicensing"] : "0"}"></input>
                            </div>
                        </li>
                        <li id="networkExistingAnnualMiscExpenseRow" class="flex items-center justify-between px-4 relative flex-col md:flex-row"">
                            <label class="flex flex-row min-h-fit lg:h-[26px]" for="networkExistingAnnualMiscExpense">Existing Annual Misc Expense</label>
                            <div>
                                <span class="ml-auto">$</span>
                                <input class="my-0.5" type="number" min="0" id="networkExistingAnnualMiscExpense" value="${this.costInputsData ? this.costInputsData["networkAccess"]["networkExistingAnnualMiscExpense"] : "0"}"></input>
                            </div>
                        </li>
                        <div class="flex flex-row justify-center grow items-center gap-2 my-8">
                            <button type="submit" id="networkAccessModalSave" class="saveModalForm w-fit border-2 p-2">Save</button>
                            <button id="networkAccessModalCancel" class="closeModal w-fit border-2 p-2">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>

            <div id="productSystemModal" class="modal flex justify-center items-center">
                <div class="flex flex-col modal-content gap-2 bg-[#fefefe] w-[90%] min-w-fit h-auto lg:w-[60%] p-2 text-md lg:text-2xl">
                    <div class="flex flex-row justify-between">
                        <div class="text-3xl font-bold">Product System</div>
                        <button id="productSystemModalCancel" class="closeModal close">&times;</button>
                    </div>
                    <form id="productSystemForm" class="modalForm flex flex-col border-t-2 p-4 overflow-auto gap-2 text-base md:text-md lg:text-2xl h-full">
                        <li id="productInitialCostRow" class="flex items-center justify-between px-4 flex-col md:flex-row"">
                            <label class="flex flex-col lg:flex-row min-h-fit lg:h-[26px] justify-center items-center gap-1" for="productInitialCost">
                                <div class="flex flex-col lg:flex-row items-center lg:items-baseline h-full"><div>Product Initial Cost&nbsp;</div><span class="flex items-center h-full text-base">(Must be provided by Product quote)</span></div>
                                <div class="input-wrapper hidden md:flex items-center h-full relative">
                                    <img class="input-image min-h-[25px] min-w-[25px] h-[25px] w-[25px]" src="./icons/question-mark-circle-icon.svg">
                                    <div class="input-description top-0 text-base border-2 hidden invisible opacity-0 bg-white h-full flex items-center justify-center left-[100%] top-0 w-max absolute">** Total project cost</div>
                                </div>
                            </label>
                            <div>
                                <span class="ml-auto">$</span>
                                <input class="my-0.5" type="number" min="1" id="productInitialCost" value="${this.costInputsData ? this.costInputsData["productSystem"]["productInitialCost"] : "0"}"></input>
                            </div>
                        </li>
                        <li id="productAnnualLicensingRow" class="flex items-center justify-between px-4 flex-col md:flex-row"">
                            <label class="flex flex-col lg:flex-row min-h-fit lg:h-[26px] justify-center items-center gap-1" for="productAnnualLicensing">
                            <div class="flex flex-col lg:flex-row items-center lg:items-baseline h-full"><div>Product Annual Licensing&nbsp;</div><span class="flex items-center h-full text-base">(Must be provided by Product quote)</span></div>
                                <div class="input-wrapper hidden md:flex  items-center h-full relative">
                                    <img class="input-image min-h-[25px] min-w-[25px] h-[25px] w-[25px]" src="./icons/question-mark-circle-icon.svg">
                                    <div class="input-description absolute top-0 text-base border-2 invisible opacity-0 bg-white h-full flex items-center justify-center left-[100%] top-0 w-max">** Expected Licensing Costs to use Product</div>
                                </div>
                            </label>
                            <div>
                                <span class="ml-auto">$</span>
                                <input class="my-0.5" type="number" min="1" id="productAnnualLicensing" value="${this.costInputsData ? this.costInputsData["productSystem"]["productAnnualLicensing"] : "0"}"></input>
                            </div>
                        </li>
                        <li id="existingAnnualLicensingRemainRow" class="flex items-center justify-between px-4 flex-col md:flex-row"">
                            <label class="flex flex-row justify-center items-center gap-1" for="existingAnnualLicensingRemain">
                            <div class="h-fit">Existing Annual Licensing to Remain</div>
                                <div class="input-wrapper hidden md:flex items-center h-[26px] relative">
                                    <img class="input-image min-h-[25px] min-w-[25px] h-[25px] w-[25px]" src="./icons/question-mark-circle-icon.svg">
                                    <div class="input-description absolute top-0 text-base border-2 invisible opacity-0 bg-white h-full flex items-center justify-center left-[100%] top-0 w-max">** Software being kept for current system</div>
                                </div>
                            </label>
                            <div>
                                <span class="ml-auto">$</span>
                                <input class="my-0.5" type="number" min="0" id="existingAnnualLicensingRemain" value="${this.costInputsData ? this.costInputsData["productSystem"]["existingAnnualLicensingRemain"] : "0"}"></input>
                            </div>
                        </li>
                        <div class="flex flex-row justify-center grow items-center gap-2 my-8">
                            <button type="submit" id="productSystemModalSave" class="saveModalForm w-fit border-2 p-2">Save</button>
                            <button id="productSystemModalCancel" class="closeModal w-fit border-2 p-2">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>


            <div id="amenityModal" class="modal flex justify-center items-center">
                <div class="flex flex-col modal-content gap-2 bg-[#fefefe] w-[90%] lg:w-[80%] h-auto p-2">
                    <div class="flex flex-row justify-between">
                        <div id="amenityModalTitle" class="text-3xl font-bold">Product System</div>
                        <button class="closeModal close">&times;</button>
                    </div>
                    <div class="flex flex-col grow">
                        <div id="amenityModalFormHeader">
                            <li id="titleTable" class="flex">
                                <div id="percentageOfTenantsTitle" class="flex flex-col w-[35%] items-center justify-center text-center font-bold">
                                    
                                </div>
                                <div id="percentageOfTenantsTitle" class="flex flex-col w-[65%] items-center justify-center text-center font-bold">
                                    <div class="case-container flex w-full flex-row">
                                        <div class="flex justify-center items-center text-center grow w-[33%]">Worst Case</div>
                                        <div class="flex justify-center items-center text-center grow w-[33%]">Average Case</div>
                                        <div class="flex justify-center items-center text-center grow w-[33%]">Best Case</div>
                                    </div>
                                </div>
                            </li>
                        </div>
                        <div id="amenityModalForm" class="flex flex-col border-t-2 grow gap-2">
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.numberApartments = parseInt(this.getNumberApartments());
        this.existingFobRekeyCostPerUser = parseFloat(this.querySelector("#fobRekeyCost").value)/100;
        this.annualUnitTurnoverCount = this.querySelector("#annualUnitTurnoverCount");
        this.fobsPerUnit = this.querySelector("#fobsPerUnit");
        this.existingAnnualLicensing = parseFloat(this.querySelector("#existingAnnualLicensing").value);
        this.existingAnnualMiscExpense = parseFloat(this.querySelector("#existingAnnualMiscExpense").value);
        this.staffTurnoverCostOption = this.querySelector('#staffTurnoverCostOption');
        this.staffTurnoverCost = this.querySelector('#staffTurnoverCost');
        this.staffTurnoverCount = this.querySelector('#staffTurnoverCount');
        this.fobRekeyCostOption = this.querySelector('#fobRekeyCostOption');
        this.fobRekeyCost = this.querySelector('#fobRekeyCost');
        this.oldAnnualUnitTurnoverCount = "";
        this.oldstaffTurnoverCount = "";

        if (!this.costInputsData) {
            this.unitLocksInnerData = {
                "numberApartments": this.numberApartments,
                "fobRekeyCost": this.existingFobRekeyCostPerUser,
                "annualUnitTurnoverCount": parseFloat(this.annualUnitTurnoverCount.value),
                "fobsPerUnit": parseFloat(this.fobsPerUnit.value),
                "existingAnnualLicensing": this.existingAnnualLicensing,
                "existingAnnualMiscExpense": this.existingAnnualMiscExpense,
            }

            this.networkAccessInnerData = {
                "staffTurnoverCount": 1,
                "staffTurnoverCost": 100,
                "networkExistingAnnualLicensing": 0,
                "networkExistingAnnualMiscExpense": 0,
            }

            this.productSystemInnerData = {
                "productInitialCost": 0,
                "productAnnualLicensing": 0,
                "existingAnnualLicensingRemain": 0,
            }

            this.costInputsData = {
                unitLocks: this.unitLocksInnerData,
                networkAccess: this.networkAccessInnerData,
                productSystem: this.productSystemInnerData,
            };

            this.setSessionStorageData('costInputsData', JSON.stringify(this.costInputsData));
        }

        this.getSessionStorageData('amenityOptionsData') ? this.amenityOptionsData = JSON.parse(this.getSessionStorageData('amenityOptionsData')) : this.amenityOptionsData = "";
        this.getSessionStorageData('propertyTypeData') ? this.propertyTypeData = JSON.parse(this.getSessionStorageData('propertyTypeData')) : this.propertyTypeData = "";

        if(!this.amenityOptionsData) {
            this.setSessionStorageData('amenityOptionsData', []);
        } else {
            this.updateAmenityCheckbox(this.amenityOptionsData);
            this.saveAmenitySelections(false, true);

            // Wait for the "analysis-table" component to be added to the DOM
            const observer = new MutationObserver((mutationsList, observer) => {
                for (const mutation of mutationsList) {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0 && mutation.addedNodes[0].id === 'dashboardTable') {
                        this.totalAllColsCalculate();
                        observer.disconnect();
                    }
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }

        this.querySelectorAll('.closeAddAmenityModal').forEach(item => {
            item.addEventListener('click', (e) => {                
                this.cancelAmenityOptions(item);
            });
        });
        
        this.querySelector('#propertyType').addEventListener('change', () => {
            this.updatePropertyType();
        });

        this.querySelector('#property').addEventListener('change', () => {
            this.totalAllColsCalculate();
        });

        this.querySelector('#addAmenity').addEventListener('click', () => {
            this.showAmenityOptions();
        });

        this.querySelector('#fobRekeyCostOption').addEventListener('input', () => {
            this.calculateFobRekeyCostOption();
        });

        this.querySelector('#staffTurnoverCostOption').addEventListener('input', () => {
            this.calculateStaffTurnoverCostOption();
        });

        this.querySelector('#selectAllAmenity').addEventListener('click', () => {
            this.selectAllAmenity(this.querySelector('#selectAllAmenity').checked);
        });
        
        this.querySelector('#saveAmenitySelections').addEventListener('click', () => {
            this.saveAmenitySelections(true, false);
        });

        this.querySelectorAll('.closeModal').forEach(item => {
            item.addEventListener('click', (e) => {                
                this.cancelModalForm(item);
            });
        });

        this.querySelectorAll('.modalForm').forEach(item => {
            item.addEventListener('submit', (e) => {
                e.preventDefault();
                
                if (item.checkValidity()) {
                    this.saveModalForm(item);
                }
            });
        });
    }
}

customElements.define('cost-analysis-dashboard', CostAnalysisDashboard);

class AnalysisTable extends HTMLElement {
    constructor() {
        super();
    }

    numberWithCommas(number) {
        return number.toLocaleString('en-US');
    }

    calculateNPV(rate, cashflows, initialCost) {
        let npv = 0;

        for (let i = 0; i < cashflows.length; i++) {
            npv += cashflows[i] / Math.pow(1 + rate, i + 1);
        }

        npv = initialCost + npv;
      
        return parseFloat(npv.toFixed(2));
    }

    calculateSimpleNetGain(cashflows, initialCost) {
        let simpleNetGain = 0;
        
        simpleNetGain = cashflows.reduce((a, b) => a + b, 0);

        simpleNetGain = -initialCost + simpleNetGain;

        return parseFloat(simpleNetGain.toFixed(2));
    }

    npv(rate, values) {
        let total = 0;
        for (let i = 0; i < values.length; i++) {
          total += values[i] / Math.pow(1 + rate, i);
        }
        return total;
    }

    calculateIRR(values, lowerBound = -0.999, upperBound = 1, tolerance = 1e-6, maxIterations = 1000) {
        return this.brent(rate => this.npv(rate, values), lowerBound, upperBound, tolerance, maxIterations);
    }

    brent(f, lowerBound, upperBound, tolerance = 1e-6, maxIterations = 1000) {
        let a = lowerBound;
        let b = upperBound;
        let c = a;
        let fa = f(a);
        let fb = f(b);
        let fc = fa;
        let s = 0;
        let fs = 0;
        let tol_act;
        let new_step;
        let prev_step;
        let cb;
      
        for (let i = 0; i < maxIterations; i++) {
          if (Math.abs(fc) < Math.abs(fb)) {
            a = b;
            b = c;
            c = a;
            fa = fb;
            fb = fc;
            fc = fa;
          }
      
          tol_act = 2 * Number.EPSILON * Math.abs(b) + tolerance / 2;
          new_step = (c - b) / 2;
      
          if (Math.abs(new_step) <= tol_act || fb === 0) {
            return (b*100).toFixed(2);
          }
      
          if (Math.abs(prev_step) >= tol_act && Math.abs(fa) > Math.abs(fb)) {
            let p;
            let q;
            cb = c - b;
      
            if (a === c) {
              p = 2 * new_step * fb / (fa - fb);
              q = 1 - fa / fb;
            } else {
              q = fa / fc;
              const r = fb / fc;
              p = new_step * (fa * (q * (q - r) * (b - c) - (1 - q) * (b - a)) - fb * q * (a - c));
              q = (q - 1) * (r - 1) * (1 - r);
            }
      
            if (p > 0) {
              q = -q;
            } else {
              p = -p;
            }
      
            if (p < (0.75 * cb * q - Math.abs(tol_act * q) / 2) &&
                p < Math.abs(prev_step * q / 2)) {
              prev_step = new_step;
              new_step = p / q;
            } else {
              prev_step = new_step;
              new_step = cb / 2;
            }
          } else {
            prev_step = new_step;
            new_step = cb / 2;
          }
      
          a = b;
          fa = fb;
      
          if (Math.abs(new_step) > tol_act) {
            b += new_step;
          } else {
            b += (new_step > 0 ? tol_act : -tol_act);
          }
      
          fb = f(b);
          if ((fb > 0 && fc > 0) || (fb < 0 && fc < 0)) {
            c = a;
            fc = fa;
          }
        }
      
        console.log('Brent method did not converge');
    }

    IRRCalc(CArray , guest) {    
        const inc = 0.000001;
        let NPV;
        do {
          guest += inc;
          NPV = 0;
          for (let j = 0; j < CArray.length; j++) {
            NPV += CArray[j] / Math.pow(1 + guest, j);
          }
        } while (NPV > 0);
        return guest * 100;
    }

    matchGS(value, range, matchType) {
        const index = range.findIndex((element) => {
          if (matchType === 1) {
            return element === value;
          } else if (matchType === -1) {
            return element < value;
          } else {
            return element > value;
          }
        });
      
        return index === -1 ? "#N/A" : index - 1;
    }

    calculateSimplePaybackPeriod(costArray, rate) {
        var simplePaybackPeriod = 0;
        var cumulativeSum = 0;

        var cumulative = costArray.map((value, index, array) => {
            cumulativeSum += array[index];
            if(index == 0) {
                return parseFloat((costArray[index]).toFixed(2));
            } else {
                return parseFloat((cumulativeSum).toFixed(2));
            }
        });

        var cumulativeIndex = this.matchGS(0, cumulative, 0);
        var cumulativeAmount = cumulative[cumulativeIndex];

        simplePaybackPeriod = ((cumulativeIndex + (cumulativeAmount / (cumulativeAmount - cumulative[cumulativeIndex + 1]))));

        return typeof(simplePaybackPeriod) === 'number' ? parseFloat((simplePaybackPeriod).toFixed(2)) : 0;
    }

    calculateDiscountedPayback(costArray, rate) {
        var discountedSimplePaybackPeriod = 0;
        var discountedCumulativeSum = 0;

        var discountedDifference = [...Array(121).keys() ].map((i) => costArray[i+1] * Math.pow((1 + rate), -(i+1)/12));

        var discountedCumulative = discountedDifference.map((value, index, array) => {
            if(index == 0) {
                discountedCumulativeSum = costArray[index];
                return parseFloat((costArray[index]).toFixed(2));
            } else {
                discountedCumulativeSum += discountedDifference[index - 1];
                return parseFloat((discountedCumulativeSum).toFixed(2));
            }
        });

        var discountedCumulativeIndex = this.matchGS(0, discountedCumulative, 0);
        var discountedCumulativeAmount = discountedCumulative[discountedCumulativeIndex];

        discountedSimplePaybackPeriod = ((discountedCumulativeIndex + (discountedCumulativeAmount / (discountedCumulativeAmount - discountedCumulative[discountedCumulativeIndex + 1]))))

        return typeof(discountedSimplePaybackPeriod) === 'number' ? parseFloat(discountedSimplePaybackPeriod.toFixed(2)) : 0;
    }


    calculateDasboardTable() {
        var dashboardTable = this.querySelector('#dashboardTable');

        var tableIndexArray = ["NPV", 
            "SimpleNetGain", 
            "IRR", 
            "SimplePaybackPeriod", 
            "DiscountedPayback" , 
            "ROI", 
            "DiscountedROI", 
            "WACC"
        ];

        var existingAnnualCost = (parseFloat((document.querySelector("#calculatedExistingAnnualCost").innerHTML).replace(',',''))/12);
        var wacc = parseFloat(document.querySelector("#property").value)/100;
        var productInitialCost = parseFloat(document.querySelector("#productInitialCost").value);

        var npvValueWorse = (totalAllColsWorst/12 - parseFloat((document.querySelector("#calculatedAnnualProductCost").innerHTML).replace(',',''))/12) + (existingAnnualCost - 0);
        var npvArrayWorst = [...Array(120).keys() ].map((i) => parseFloat(npvValueWorse.toFixed(2)));

        var npvValueEstimated = (totalAllCols/12 - parseFloat((document.querySelector("#calculatedAnnualProductCost").innerHTML).replace(',',''))/12) + (existingAnnualCost - 0);
        var npvArrayEstimated = [...Array(120).keys() ].map((i) => parseFloat(npvValueEstimated.toFixed(2)));

        var npvValueBest = (totalAllColsBest/12 - parseFloat((document.querySelector("#calculatedAnnualProductCost").innerHTML).replace(',',''))/12) + (existingAnnualCost - 0);
        var npvArrayBest = [...Array(120).keys() ].map((i) => parseFloat(npvValueBest.toFixed(2)));
        
        var npvRate = parseFloat((parseFloat(Math.pow(wacc + 1, 1/12).toFixed(12)) - 1).toFixed(12))

        var npvData = {
            "worstCase": this.numberWithCommas(this.calculateNPV(npvRate, npvArrayWorst, -productInitialCost + 0) < 0 ? 'N/A' : '$' + this.calculateNPV(npvRate, npvArrayWorst, -productInitialCost + 0)),
            "estimatedCase": this.numberWithCommas(this.calculateNPV(npvRate, npvArrayEstimated, -productInitialCost + 0) < 0 ? 'N/A' : '$' + this.calculateNPV(npvRate, npvArrayEstimated, -productInitialCost + 0)),
            "bestCase": this.numberWithCommas(this.calculateNPV(npvRate, npvArrayBest, -productInitialCost + 0) < 0 ? 'N/A' : '$' + this.calculateNPV(npvRate, npvArrayBest, -productInitialCost + 0))
        }

        var simpleNetGainData = {
            "worstCase": this.numberWithCommas(this.calculateSimpleNetGain(npvArrayWorst, productInitialCost) < 0 ? 'N/A' : '$' + this.calculateSimpleNetGain(npvArrayWorst, productInitialCost)),
            "estimatedCase": this.numberWithCommas(this.calculateSimpleNetGain(npvArrayEstimated, productInitialCost) < 0 ? 'N/A' : '$' + this.calculateSimpleNetGain(npvArrayEstimated, productInitialCost)),
            "bestCase": this.numberWithCommas(this.calculateSimpleNetGain(npvArrayBest, productInitialCost) < 0 ? 'N/A' : '$' + this.calculateSimpleNetGain(npvArrayBest, productInitialCost))
        }

        var irrArrayWorst = [...npvArrayWorst];
        var irrArrayEstimated = [...npvArrayEstimated];
        var irrArrayBest = [...npvArrayBest];

        irrArrayWorst.unshift(-productInitialCost);
        irrArrayEstimated.unshift(-productInitialCost);
        irrArrayBest.unshift(-productInitialCost);

        var irrData = {
            "worstCase": ((((parseFloat(this.calculateIRR(irrArrayWorst))/100) + 1) ** 12 - 1)*100) > 250000 || ((((parseFloat(this.calculateIRR(irrArrayWorst))/100) + 1) ** 12 - 1)*100) < 0 ? 'N/A' : ((((parseFloat(this.calculateIRR(irrArrayWorst))/100) + 1) ** 12 - 1)*100).toFixed(2) + '%',
            "estimatedCase": ((((parseFloat(this.calculateIRR(irrArrayEstimated))/100) + 1) ** 12 - 1)*100) > 250000 || ((((parseFloat(this.calculateIRR(irrArrayEstimated))/100) + 1) ** 12 - 1)*100) < 0 ? 'N/A' : ((((parseFloat(this.calculateIRR(irrArrayEstimated))/100) + 1) ** 12 - 1)*100).toFixed(2) + '%',
            "bestCase": ((((parseFloat(this.calculateIRR(irrArrayBest))/100) + 1) ** 12 - 1)*100) > 250000 || ((((parseFloat(this.calculateIRR(irrArrayBest))/100) + 1) ** 12 - 1)*100) < 0 ? 'N/A' : ((((parseFloat(this.calculateIRR(irrArrayBest))/100) + 1) ** 12 - 1)*100).toFixed(2) + '%'
        }

        var simplePaybackPeriodData = {
            "worstCase": this.calculateSimplePaybackPeriod(irrArrayWorst, wacc),
            "estimatedCase": this.calculateSimplePaybackPeriod(irrArrayEstimated, wacc),
            "bestCase": this.calculateSimplePaybackPeriod(irrArrayBest, wacc)
        }

        var discountedPaybackData = {
            "worstCase": this.calculateDiscountedPayback(irrArrayWorst, wacc),
            "estimatedCase": this.calculateDiscountedPayback(irrArrayEstimated, wacc),
            "bestCase": this.calculateDiscountedPayback(irrArrayBest, wacc)
        }

        var roiData = {
            "worstCase": this.calculateNPV(npvRate, npvArrayWorst, -productInitialCost + 0) < 0 || (Math.abs(this.calculateSimpleNetGain(npvArrayWorst, productInitialCost) / -productInitialCost) * 100).toFixed(1) === "Infinity" ? 'N/A' : (Math.abs(this.calculateSimpleNetGain(npvArrayWorst, productInitialCost) / -productInitialCost) * 100).toFixed(1) + '%',
            "estimatedCase": this.calculateNPV(npvRate, npvArrayEstimated, -productInitialCost + 0) < 0 || (Math.abs(this.calculateSimpleNetGain(npvArrayEstimated, productInitialCost) / -productInitialCost) * 100).toFixed(1) === "Infinity" ? 'N/A' :  (Math.abs(this.calculateSimpleNetGain(npvArrayEstimated, productInitialCost) / -productInitialCost) * 100).toFixed(1) + '%',
            "bestCase": this.calculateNPV(npvRate, npvArrayBest, -productInitialCost + 0) < 0 || (Math.abs(this.calculateSimpleNetGain(npvArrayBest, productInitialCost) / -productInitialCost) * 100).toFixed(1) === "Infinity" ? 'N/A' : (Math.abs(this.calculateSimpleNetGain(npvArrayBest, productInitialCost) / -productInitialCost) * 100).toFixed(1) + '%'
        }

        var discountedRoiData = {
            "worstCase": this.calculateNPV(npvRate, npvArrayWorst, -productInitialCost + 0) < 0 || (Math.abs(this.calculateNPV(npvRate, npvArrayWorst, -productInitialCost + 0) / -productInitialCost) * 100).toFixed(1) === "Infinity" ? 'N/A' : (Math.abs(this.calculateNPV(npvRate, npvArrayWorst, -productInitialCost + 0) / -productInitialCost) * 100).toFixed(1) + '%',
            "estimatedCase": this.calculateNPV(npvRate, npvArrayEstimated, -productInitialCost + 0) < 0 || (Math.abs(this.calculateNPV(npvRate, npvArrayEstimated, -productInitialCost + 0) / -productInitialCost) * 100).toFixed(1) === "Infinity" ? 'N/A' : (Math.abs(this.calculateNPV(npvRate, npvArrayEstimated, -productInitialCost + 0) / -productInitialCost) * 100).toFixed(1) + '%',
            "bestCase": this.calculateNPV(npvRate, npvArrayBest, -productInitialCost + 0) < 0 || (Math.abs(this.calculateNPV(npvRate, npvArrayBest, -productInitialCost + 0) / -productInitialCost) * 100).toFixed(1) === "Infinity" ? 'N/A' : (Math.abs(this.calculateNPV(npvRate, npvArrayBest, -productInitialCost + 0) / -productInitialCost) * 100).toFixed(1) + '%'
        }

        var waccData = {
            "worstCase": (wacc * 100).toFixed(1),
            "estimatedCase": (wacc * 100).toFixed(1),
            "bestCase": (wacc * 100).toFixed(1)
        }

        this.dashboardTableData = {
            "NPV": npvData,
            "SimpleNetGain": simpleNetGainData,
            "IRR": irrData,
            "SimplePaybackPeriod": simplePaybackPeriodData,
            "DiscountedPayback": discountedPaybackData,
            "ROI": roiData,
            "DiscountedROI": discountedRoiData,
            "WACC": waccData
        }

        tableIndexArray.forEach(tableIndex => {
            dashboardTable.querySelector('#worseCase'+tableIndex).innerHTML = this.dashboardTableData[tableIndex]["worstCase"];
            dashboardTable.querySelector('#estimatedCase'+tableIndex).innerHTML = this.dashboardTableData[tableIndex]["estimatedCase"];
            dashboardTable.querySelector('#bestCase'+tableIndex).innerHTML = this.dashboardTableData[tableIndex]["bestCase"];
        });

        var amenityOptionsData = this.getSessionStorageData('amenityOptionsData') ? JSON.parse(this.getSessionStorageData('amenityOptionsData')) : [];

        if (amenityOptionsData.length == 0) {
            this.querySelector('#dashboardTable').classList.add('hidden');
        } else {
            this.querySelector('#dashboardTable').classList.remove('hidden');
        }

    }
    
    setSessionStorageData(key, value) {
        sessionStorage.setItem(key, value);
    }

    getSessionStorageData(key) {
        return sessionStorage.getItem(key);
    }

    connectedCallback() {
        this.innerHTML = `<div id="dashboardTable" class="flex flex-row w-full gap-4 justify-start lg:justify-center max-w-[1000px] hidden">
        <div class="w-full p-[0.15rem] min-w-[500px]">
            <div id="dashboardTableHeader" class="flex flex-row font-bold uppercase tracking-wider">
                <div class="flex-1 p-[0.15rem]"></div>
                <div class="flex-1 flex justify-center items-center font-bold">Worst Case</div>
                <div class="flex-1 flex justify-center items-center font-bold">Estimated</div>
                <div class="flex-1 flex justify-center items-center font-bold">Best Case</div>
            </div>
            <div id="dashboardTableBody" class="bg-[#e4e4e44c] text-lg">
                <div id="dashboardTableRowNPV" class="flex flex-row">
                    <div class="flex-1 p-[0.15rem]">NPV</div>
                    <div class="flex-1 flex justify-center items-center"><span id="worseCaseNPV"></span></div>
                    <div class="flex-1 flex justify-center items-center "><span id="estimatedCaseNPV"></span></div>
                    <div class="flex-1 flex justify-center items-center"><span id="bestCaseNPV"></span></div>
                </div>
                <div id="dashboardTableRowSimpleNetGain" class="flex flex-row">
                    <div class="flex-1 p-[0.15rem]">Simple Net Gain</div>
                    <div class="flex-1 flex justify-center items-center"><span id="worseCaseSimpleNetGain"></span></div>
                    <div class="flex-1 flex justify-center items-center"><span id="estimatedCaseSimpleNetGain"></span></div>
                    <div class="flex-1 flex justify-center items-center"><span id="bestCaseSimpleNetGain"></span></div>
                </div>
                <div id="dashboardTableRowIRR" class="flex flex-row">
                    <div class="flex-1 p-[0.15rem]">IRR (annualized)</div>
                    <div class="flex-1 flex justify-center items-center"><span id="worseCaseIRR"></span></div>
                    <div class="flex-1 flex justify-center items-center"><span id="estimatedCaseIRR"></span></div>
                    <div class="flex-1 flex justify-center items-center"><span id="bestCaseIRR"></span></div>
                </div>
                <div id="dashboardTableRowSimplePaybackPeriod" class="flex flex-row">
                    <div class="flex-1 p-[0.15rem]">Simple Payback Period - In Months</div>
                    <div class="flex-1 flex justify-center items-center"><span id="worseCaseSimplePaybackPeriod"></span></div>
                    <div class="flex-1 flex justify-center items-center"><span id="estimatedCaseSimplePaybackPeriod"></span></div>
                    <div class="flex-1 flex justify-center items-center"><span id="bestCaseSimplePaybackPeriod"></span></div>
                </div>
                <div id="dashboardTableRowDiscountedPayback" class="flex flex-row">
                    <div class="flex-1 p-[0.15rem]">Discounted Payback - In Months</div>
                    <div class="flex-1 flex justify-center items-center"><span id="worseCaseDiscountedPayback"></span></div>
                    <div class="flex-1 flex justify-center items-center"><span id="estimatedCaseDiscountedPayback"></span></div>
                    <div class="flex-1 flex justify-center items-center"><span id="bestCaseDiscountedPayback"></span></div>
                </div>
                <div id="dashboardTableRowROI" class="flex flex-row">
                    <div class="flex-1 p-[0.15rem]">ROI - 10 Years</div>
                    <div class="flex-1 flex justify-center items-center"><span id="worseCaseROI"></span></div>
                    <div class="flex-1 flex justify-center items-center"><span id="estimatedCaseROI"></span></div>
                    <div class="flex-1 flex justify-center items-center"><span id="bestCaseROI"></span></div>
                </div>
                <div id="dashboardTableRowDiscountedROI" class="flex flex-row">
                    <div class="flex-1 p-[0.15rem]">Discounted ROI - 10 Years</div>
                    <div class="flex-1 flex justify-center items-center"><span id="worseCaseDiscountedROI"></span></div>
                    <div class="flex-1 flex justify-center items-center"><span id="estimatedCaseDiscountedROI"></span></div>
                    <div class="flex-1 flex justify-center items-center"><span id="bestCaseDiscountedROI"></span></div>
                </div>
                <div id="dashboardTableRowWACC" class="flex flex-row">
                    <div class="flex-1 p-[0.15rem]">WACC (annually)</div>
                    <div class="flex-1 flex justify-center items-center"><span id="worseCaseWACC"></span>%</div>
                    <div class="flex-1 flex justify-center items-center rounded-b-md"><span id="estimatedCaseWACC"></span>%</div>
                    <div class="flex-1 flex justify-center items-center"><span id="bestCaseWACC"></span>%</div>
                </div>
            </div>
        </div>`;
    }
}

customElements.define('analysis-table', AnalysisTable);

class FormSection extends HTMLElement {
    constructor() {
      super();
    }

    numberWithCommas(number) {
        return number.toLocaleString('en-US');
    }

    deleteAmenitySelection(item) {
        item.style.display = "none";
        this.closest('cost-analysis-dashboard').updateAmenityCheckbox(item.id);
    }

    editFormSelection(item) {
        this.closest('cost-analysis-dashboard').showSelection(item);
    }

    editFormSelectionAmenity(item) {
        this.closest('cost-analysis-dashboard').showSelectionAmenity(item);
    }
  
    connectedCallback() {
        var formType = this.getAttribute('formType');
        this.innerHTML = `
            <div class="flex flex-row justify-between items-center">
                <div class="form-title ">${this.getAttribute('formTitle')}</div>
                ${this.getAttribute('formType') === "normal" ? "<button id='editSection' class='w-[20px] flex items-end'><img src='/icons/edit-block.svg'></button>" : "<button id='deleteSection' class='ml-auto mr-2 w-[20px] flex items-end'><img src='/icons/delete-block.svg'></button><button id='editSection' class='w-[20px] flex items-end'><img src='/icons/edit-block.svg'></button>"}
            </div>
            <div class="flex flex-row justify-between text-xl">
                <div class="form-description">${this.getAttribute('formType') === "normal" ? this.getAttribute('id') === "unitLocks" ? `<span id='numApartments'>${this.getAttribute('numApts')}</span> Apartments` : this.getAttribute('id') === "networkAccess" ? "Turnover + Existing" : this.getAttribute('id') === "productSystem" ? "Cost to switch" : "" : "Product Estimate:"}</div>
                <div class="flex flex-row">$<span id="${this.getAttribute('id')}Calculated">${this.getAttribute('formType') === "amenity" ? `${this.numberWithCommas(parseFloat(this.getAttribute("costInfo"))) + "/month"}` : ""}</span></div>
            </div>
        `;

        if (formType === "amenity") {
            this.querySelector('#deleteSection').addEventListener('click', () => {
                this.deleteAmenitySelection(this);
            });

            this.querySelector('#editSection').addEventListener('click', () => {
                this.editFormSelectionAmenity(this);
            });
        } else {
            this.querySelector('#editSection').addEventListener('click', () => {
                this.editFormSelection(this);
            });

            if (this.getAttribute('id') === "unitLocks") {
                this.closest('cost-analysis-dashboard').calculateUnitLocks();
            } else if (this.getAttribute('id') === "networkAccess") {
                this.closest('cost-analysis-dashboard').calculateNetworkAccess();
            } else if (this.getAttribute('id') === "productSystem") {
                this.closest('cost-analysis-dashboard').calculateProductSystem();
                this.closest('cost-analysis-dashboard').calculatedExistingAnnualCost(false);
            }
        }
    }
}
  
customElements.define('form-section', FormSection);

class AmenityDetails extends HTMLElement {
    getId() {
        return this.id
    }

    getNumberApartments() {
        var numberApartments = this.closest('cost-analysis-dashboard').getNumberApartments();
        return numberApartments;
    }
    
    annualRevenueBestCalculate() {
        var percentTenantsElectingServiceBestValue = this.percentTenantsElectingServiceBest.value || 0;
        var revenuePerMonthPerTenantBestValue = this.revenuePerMonthPerTenantBest.value || 0;
        this.getNumberApartments();

        if (this.rowAlternate) {
            this.annualRevenueBest.value = parseFloat(percentTenantsElectingServiceBestValue * revenuePerMonthPerTenantBestValue * 12).toFixed(2);    
        } else {
            var numberApartmentsCheckValue = this.numberApartmentsCheck || 0;
            this.annualRevenueBest.value = parseFloat((percentTenantsElectingServiceBestValue/100) * revenuePerMonthPerTenantBestValue * 12 * numberApartmentsCheckValue).toFixed(2);    
        }
    }
    
    annualRevenueAvgCalculate() {
        var percentTenantsElectingServiceAvgValue = this.percentTenantsElectingServiceAvg.value || 0;
        var revenuePerMonthPerTenantAvgValue = this.revenuePerMonthPerTenantAvg.value || 0;
        
        if (this.rowAlternate) {
            this.annualRevenueAvg.value = parseFloat(percentTenantsElectingServiceAvgValue * revenuePerMonthPerTenantAvgValue * 12).toFixed(2);
        } else {
            var numberApartmentsCheckValue = this.numberApartmentsCheck || 0;
            this.annualRevenueAvg.value = parseFloat((percentTenantsElectingServiceAvgValue/100) * revenuePerMonthPerTenantAvgValue * 12 * numberApartmentsCheckValue).toFixed(2);
        }
    }
    
    annualRevenueWorstCalculate() {
        var percentTenantsElectingServiceWorstValue = this.percentTenantsElectingServiceWorst.value || 0;
        var revenuePerMonthPerTenantWorstValue = this.revenuePerMonthPerTenantWorst.value || 0;
        
        if (this.rowAlternate) {
            this.annualRevenueWorst.value = parseFloat(percentTenantsElectingServiceWorstValue * revenuePerMonthPerTenantWorstValue * 12).toFixed(2);
        } else {
            var numberApartmentsCheckValue = this.numberApartmentsCheck || 0;
            this.annualRevenueWorst.value = parseFloat((percentTenantsElectingServiceWorstValue/100) * revenuePerMonthPerTenantWorstValue * 12 * numberApartmentsCheckValue).toFixed(2);
        }
        
    }

    productEstimateRevenueCalculate(selected) {
        if (selected === "worst") {
            this.productEstimateRevenue.value = this.annualRevenueWorst.value
        } else if (selected === "average") {
            this.productEstimateRevenue.value = this.annualRevenueAvg.value
        } else if (selected === "best") {
            this.productEstimateRevenue.value = this.annualRevenueBest.value
        }
    }

    totalAllColsCalculate() {
        this.getSessionStorageData('amenitysData') ? this.amenitysData = JSON.parse(this.getSessionStorageData('amenitysData')) : this.amenitysData = "";
    
        totalAllColsWorst = 0;
        totalAllColsAvg = 0;
        totalAllColsBest = 0;
        totalAllCols = 0;

        if (this.amenitysData) {
            Object.keys(this.amenitysData).forEach(key => {
                totalAllColsWorst += parseFloat(this.amenitysData[key]["annualRevenueWorst"]);
                totalAllColsAvg += parseFloat(this.amenitysData[key]["annualRevenueAvg"]);
                totalAllColsBest += parseFloat(this.amenitysData[key]["annualRevenueBest"]);
                totalAllCols += parseFloat(this.amenitysData[key]["productEstimate"]*12);
            });
        }
    }

    displayCaseContainer() {
        var elemCols = document.querySelectorAll("#" + this.getId() + ' > li > div.invisible');
        [].forEach.call(elemCols, function(col) {
            col.classList.remove("invisible");
        });
        
    }

    hideCaseContainer() {
        var elemCols = document.querySelectorAll("#" + this.getId() + ' > li > div.case-container,#' + this.getId() + ' > li > div.case-container-readonly,#' + this.getId() + ' > li > div.product-container');
        [].forEach.call(elemCols, function(col) {
            col.classList.add("invisible");
        });

    }

    saveAmenityForm(item) {
        this.amenitysData[item.id]["occurPerMonth"] = [this.percentTenantsElectingServiceWorst.value, this.percentTenantsElectingServiceAvg.value, this.percentTenantsElectingServiceBest.value];
        this.amenitysData[item.id]["revPerOccurs"] = [this.revenuePerMonthPerTenantWorst.value, this.revenuePerMonthPerTenantAvg.value, this.revenuePerMonthPerTenantBest.value];
        this.amenitysData[item.id]["productCase"] = this.productCase.value;
        this.amenitysData[item.id]["productEstimate"] = this.productEstimateRevenue.value/12;

        this.setSessionStorageData('amenitysData', JSON.stringify(this.amenitysData));

        document.querySelector("#" + item.id + "Calculated").innerHTML = parseFloat(this.productEstimateRevenue.value/12) + "/month";

        document.querySelector("#amenityModal").style.display = "none";

        this.totalAllColsCalculate();
        startGraph();
    }

    cancelAmenityForm() {
        this.amenitysData = JSON.parse(this.getSessionStorageData('amenitysData'));

        this.percentTenantsElectingServiceWorst = this.amenitysData[this.getId()]["occurPerMonth"][0];
        this.percentTenantsElectingServiceAvg = this.amenitysData[this.getId()]["occurPerMonth"][1];
        this.percentTenantsElectingServiceBest = this.amenitysData[this.getId()]["occurPerMonth"][2];
        this.revenuePerMonthPerTenantWorst = this.amenitysData[this.getId()]["revPerOccurs"][0];
        this.revenuePerMonthPerTenantAvg = this.amenitysData[this.getId()]["revPerOccurs"][1];
        this.revenuePerMonthPerTenantBest = this.amenitysData[this.getId()]["revPerOccurs"][2];

        this.annualRevenueWorst = this.amenitysData[this.getId()]["annualRevenueWorst"];
        this.annualRevenueAvg = this.amenitysData[this.getId()]["annualRevenueAvg"];
        this.annualRevenueBest = this.amenitysData[this.getId()]["annualRevenueBest"];

        this.productEstimateCase = this.amenitysData[this.getId()]["productCase"];
        this.productEstimateRevenue = this.amenitysData[this.getId()]["productEstimate"]*12;
        
        document.querySelector("#amenityModal").style.display = "none";
    }


    setSessionStorageData(key, value) {
        sessionStorage.setItem(key, value);
    }

    getSessionStorageData(key) {
        return sessionStorage.getItem(key);
    }

    connectedCallback() {

        const title = this.getAttribute("title");
        const occurPerMonth = this.getAttribute("occurPerMonth").split(",").map(Number);
        const revPerOccur = this.getAttribute("revPerOccur").split(",").map(Number);
        const productCase = this.getAttribute("productCase");
        const alternate = this.getAttribute("alternate") === 'true';

        this.innerHTML = `
        <li class="flex flex-col grow">
            <div class="flex flex-row">
                <div class="flex w-[35%] justify-center items-center border-b-2 p-[10px] text-center">${alternate ? 'Occurrences per Month' : 'Percentage of Tenants Electing Service'}</div>
                <div class="case-container flex w-[65%] percentTenantsElectingServiceWrapper">
                    <div class="flex items-center justify-center grow relative">
                        <span class="w-[15px]">&nbsp;</span>
                        <input class="w-[50%]" type="number" min="0" max="100" id="percentTenantsElectingServiceWorst" value="${occurPerMonth[0]}">
                        ${alternate ? '<span class="w-[15px]">&nbsp;</span>' : '<span class="w-[15px]">%</span>'}
                    </div>
                    <div class="flex items-center justify-center grow relative">
                        <span class="w-[15px]">&nbsp;</span>
                        <input class="w-[50%]" type="number" min="0" max="100" id="percentTenantsElectingServiceAvg" value="${occurPerMonth[1]}">
                        ${alternate ? '<span class="w-[15px]">&nbsp;</span>' : '<span class="w-[15px]">%</span>'}
                    </div>
                    <div class="flex items-center justify-center grow relative">
                        <span class="w-[15px]">&nbsp;</span>
                        <input class="w-[50%]" type="number" min="0" max="100" id="percentTenantsElectingServiceBest" value="${occurPerMonth[2]}">
                        ${alternate ? '<span class="w-[15px]">&nbsp;</span>' : '<span class="w-[15px]">%</span>'}
                    </div>
                </div>
            </div>
            <div class="flex flex-row">
                <div class="flex w-[35%] justify-center items-center border-b-2 p-[10px] text-center">${alternate ? 'Revenue per Occurrence' : 'Revenue per Month per Tenant'}</div>
                <div class="case-container flex w-[65%] revenuePerMonthPerTenantWrapper">
                    <div class="flex items-center justify-center grow relative">
                        <span class="w-[15px]">$</span>
                        <input class="w-[50%]" type="number" min="0" step="0.01" id="revenuePerMonthPerTenantWorst" value="${revPerOccur[0]}">
                        <span class="w-[15px]">&nbsp;</span>
                    </div>
                    <div class="flex items-center justify-center grow relative">
                        <span class="w-[15px]">$</span>
                        <input class="w-[50%]" type="number" min="0" step="0.01" id="revenuePerMonthPerTenantAvg" value="${revPerOccur[1]}">
                        <span class="w-[15px]">&nbsp;</span>
                    </div>
                    <div class="flex items-center justify-center grow relative">
                        <span class="w-[15px]">$</span>
                        <input class="w-[50%]" type="number" min="0" step="0.01" id="revenuePerMonthPerTenantBest" value="${revPerOccur[2]}">
                        <span class="w-[15px]">&nbsp;</span>
                    </div>
                </div>
            </div>
            <div class="flex flex-row">
                <div class="flex w-[35%] justify-center items-center border-b-2 p-[10px] text-center">Annual Revenue</div>
                <div class="case-container-readonly flex w-[65%] annualRevenueWrapper">
                    <div class="flex items-center justify-center grow relative">
                        <span class="w-[15px]">$</span>
                        <input class="w-[50%] border-0" type="number" min="0" step="0.01" id="${occurPerMonth.length === 1 ? 'annualRevenueWorstTotal' : 'annualRevenueWorst'}" value="" readonly>
                        <span class="w-[15px]">&nbsp;</span>
                    </div>
                    <div class="flex items-center justify-center grow relative">
                        <span class="w-[15px]">$</span>
                        <input class="w-[50%] border-0" type="number" min="0" step="0.01" id="${occurPerMonth.length === 1 ? 'annualRevenueAvgTotal' : 'annualRevenueAvg'}" value="" readonly>
                        <span class="w-[15px]">&nbsp;</span>
                    </div>
                    <div class="flex items-center justify-center grow relative">
                        <span class="w-[15px]">$</span>
                        <input class="w-[50%] border-0" type="number" min="0" step="0.01" id="${occurPerMonth.length === 1 ? 'annualRevenueBestTotal' : 'annualRevenueBest'}" value="" readonly>
                        <span class="w-[15px]">&nbsp;</span>
                    </div>
                </div>
            </div>
            <div class="flex flex-row mt-auto mb-auto justify-center">
                <div class="flex w-[35%] justify-center items-center border-b-2 p-[10px] text-center">Product Estimate</div>
                <div class="product-container m-auto flex items-center justify-center w-[50%] ${occurPerMonth.length === 1 ? '!border-0' : ''}">
                    <div class="flex h-full items-center justify-center w-[50%] ${occurPerMonth.length === 1 ? 'invisible' : ''}">
                        <select id="productEstimateCase" class="w-[90%] border-black	border-2">
                            <option value="worst" ${productCase === 'worst' ? 'selected' : ''}>Worst Case</option>
                            <option value="average" ${productCase === 'average' ? 'selected' : ''}>Average Case</option>
                            <option value="best" ${productCase === 'best' ? 'selected' : ''}>Best Case</option>
                        </select>
                    </div>
                    <div class="flex h-full items-center justify-center w-[50%] relative ${occurPerMonth.length === 1 ? '' : ''}">
                        <span class="w-[15px]">$</span>
                        <input class="w-[70%]" type="number" min="0" id="${occurPerMonth.length === 1 ? 'productEstimateRevenueTotal' : 'productEstimateRevenue'}" readonly>
                    </div>
                </div>
            </div>
        </li>

        <div class="flex flex-row justify-center items-center gap-2 my-8">
            <button id="saveAmenityForm" class="w-fit border-2 p-2">Save</button>
            <button id="closeAmenityForm" class="closeModal w-fit border-2 p-2">Cancel</button>
        </div>
        `;

        this.rowAlternate = alternate;
        this.numberApartmentsCheck = this.getNumberApartments();

        this.percentTenantsElectingServiceWorst = this.querySelector("#" + this.getId() + ' #percentTenantsElectingServiceWorst');
        this.percentTenantsElectingServiceAvg = this.querySelector("#" + this.getId() + ' #percentTenantsElectingServiceAvg');
        this.percentTenantsElectingServiceBest = this.querySelector("#" + this.getId() + ' #percentTenantsElectingServiceBest');
        this.revenuePerMonthPerTenantWorst = this.querySelector("#" + this.getId() + ' #revenuePerMonthPerTenantWorst');
        this.revenuePerMonthPerTenantAvg = this.querySelector("#" + this.getId() + ' #revenuePerMonthPerTenantAvg');
        this.revenuePerMonthPerTenantBest = this.querySelector("#" + this.getId() + ' #revenuePerMonthPerTenantBest');

        this.productCase = this.querySelector("#" + this.getId() + ' #productEstimateCase');

        this.annualRevenueWorst = this.querySelector("#" + this.getId() + ' #annualRevenueWorst');
        this.annualRevenueAvg = this.querySelector("#" + this.getId() + ' #annualRevenueAvg');
        this.annualRevenueBest = this.querySelector("#" + this.getId() + ' #annualRevenueBest');

        this.productEstimateCase = this.querySelector("#" + this.getId() + ' #productEstimateCase');
        this.productEstimateRevenue = this.querySelector("#" + this.getId() + ' #productEstimateRevenue');

        this.inputChecker = document.querySelectorAll("#" + this.getId() + " .case-container input")

        this.annualRevenueBestCalculate();
        this.annualRevenueAvgCalculate();
        this.annualRevenueWorstCalculate();
        this.productEstimateRevenueCalculate(this.productEstimateCase.value);

        this.productEstimateCase.addEventListener("input", () => {
            this.productEstimateRevenueCalculate(this.productEstimateCase.value);
        });

        this.inputChecker.forEach(input => input.addEventListener('input', () => {
            this.annualRevenueWorstCalculate();
            this.annualRevenueAvgCalculate();
            this.annualRevenueBestCalculate();
            this.productEstimateRevenueCalculate(this.productEstimateCase.value);
        }));

        this.getSessionStorageData('amenitysData') ? this.amenitysData = JSON.parse(this.getSessionStorageData('amenitysData')) : this.amenitysData = "";

        if (!this.amenitysData) {
            this.innerData = {
                "occurPerMonth": [occurPerMonth[0], occurPerMonth[1], occurPerMonth[2]],
                "revPerOccurs": [revPerOccur[0], revPerOccur[1], revPerOccur[2]],
                "productCase": productCase,
                "productEstimate": this.productEstimateRevenue.value/12,
                "annualRevenueWorst": this.annualRevenueWorst.value,
                "annualRevenueAvg": this.annualRevenueAvg.value,
                "annualRevenueBest": this.annualRevenueBest.value
            }

            this.amenitysData = {
                [this.id]: this.innerData,
            };

            this.setSessionStorageData('amenitysData', JSON.stringify(this.amenitysData));

        } else {
            this.innerData = {
                "occurPerMonth": [occurPerMonth[0], occurPerMonth[1], occurPerMonth[2]],
                "revPerOccurs": [revPerOccur[0], revPerOccur[1], revPerOccur[2]],
                "productCase": productCase,
                "productEstimate": this.productEstimateRevenue.value/12,
                "annualRevenueWorst": this.annualRevenueWorst.value,
                "annualRevenueAvg": this.annualRevenueAvg.value,
                "annualRevenueBest": this.annualRevenueBest.value
            }

            this.newAmenityData = {
                [this.id]: this.innerData,
            };

            this.amenitysData = Object.assign(this.amenitysData, this.newAmenityData);

            this.setSessionStorageData('amenitysData', JSON.stringify(this.amenitysData));
        }

        document.querySelectorAll('#amenityModal .closeModal').forEach(item => {
            item.addEventListener('click', (e) => {                
                this.cancelAmenityForm(this);
            });
        });
    

        this.querySelector('#saveAmenityForm').addEventListener('click', () => {
            this.saveAmenityForm(this);
        });

        this.totalAllColsCalculate();
    }
}

customElements.define( 'amenity-details', AmenityDetails );

function startGraph() {

    if (myChart) {
        myChart.destroy();
    }
    
    var ctx = document.getElementById('analysisOverviewChart');

    let calculatedAnnualProductCost = parseInt(document.querySelector("#calculatedAnnualProductCost").innerHTML.replace(/,/g, '')) / 12;
    let productInitialCost = parseFloat(document.querySelector("#productInitialCost").value);

    var previousResult = 0; // This will hold the previous result
    var bestCaseArray = [...Array(121).keys() ].map((i) => {
        if(i == 0) {
            previousResult = -productInitialCost;
            return previousResult;
        } else {
            previousResult = previousResult - calculatedAnnualProductCost + (parseInt(totalAllColsBest)/12);
            return previousResult;
        }
    });

    // var averageCaseArray = [...Array(121).keys() ].map((i) => i * parseInt(annualRevenueAvgTotal.value)/12);

    var worstCaseArray = [...Array(121).keys() ].map((i) => {
        if(i == 0) {
            previousResult = -productInitialCost;
            return previousResult;
        } else {
            previousResult = previousResult - calculatedAnnualProductCost + (parseInt(totalAllColsWorst)/12);
            return previousResult;
        }
    });

    estimateCaseArray = [...Array(121).keys() ].map((i) =>{
        if(i == 0) {
            previousResult = -productInitialCost;
            return previousResult;
        } else {
            previousResult = previousResult - calculatedAnnualProductCost + (parseInt(totalAllCols)/12);
            return previousResult;
        }
    });

    var existingCaseArray = [...Array(121).keys() ].map((i) => i * -parseInt(existingAnnualCost.innerHTML.replace(/,/g, ''))/12);

    var xAxis = [...Array(121).keys() ].map((i) => i);

    myChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: xAxis,
        datasets: [{
            label: 'GK - Best Case',
            data: bestCaseArray,
            borderColor: '#00B050',
            backgroundColor: '#00B050',
            borderWidth: 1
        }, {
            label: 'GK - Worst Case',
            data: worstCaseArray,
            borderColor: '#FFC000',
            backgroundColor: '#FFC000',
            borderWidth: 1
        }, {
            label: 'GK - Estimated',
            data: estimateCaseArray,
            borderColor: '#00B0F0',
            backgroundColor: '#00B0F0',
            borderWidth: 1
        }, {
            label: 'Current System',
            data: existingCaseArray,
            borderColor: '#FF0000',
            backgroundColor: '#FF0000',
            borderWidth: 1
        }]
      },
      options: {
        plugins: {
            title: {
                display: true,
                text: 'Analysis of Product Revenue',
                padding: {
                    top: 10,
                    bottom: 30
                },
                font: {
                    size: 24
                }
            }
        },
        scales: {
          y: {
            title: {
                display: true,
                text: 'Net Operating Income - Access Control',
                font: {
                    size: 18
                }
            },
            beginAtZero: true,
            ticks: {
                // Include a dollar sign in the ticks
                callback: function(value, index, ticks) {
                    return '$' + value;
                },
                font: {
                    size: 14
                }
            }
          },
          x: {
            title: {
                display: true,
                text: 'Months',
                font: {
                    size: 18
                }
            },
            ticks: {
                font: {
                    size: 9
                }
            }
          }
        }
      }
    });
}