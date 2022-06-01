const sequelize = require('../database/db-config');
const Sequelize = require('sequelize');
// const ShipmentModels = require('./shipments.model');

const AdminModels = {};

/*********************** Role types schema defining *************************/
AdminModels.RoleTypes = sequelize.define('role_types', {
  id: {
    type: Sequelize.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true
  },
  type: {
    type: Sequelize.STRING,
    unique: true
  }
},
  {
    underscored: true,
    freezeTableName: true,
    tableName: 'role_types',
    indexes: [
      {
        fields: ['type']
      }
    ]
  }
);
/*********************** End of role types schema defining *************************/

/*********************** Roles schema defining *************************/
AdminModels.Roles = sequelize.define('roles', {
  id: {
    type: Sequelize.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true
  },
  role_name: {
    type: Sequelize.STRING,
    unique: true
  },
  role_type: {
    type: Sequelize.STRING
  },
  access_modules: {
    type: Sequelize.JSON,
  }
},
  {
    underscored: true,
    freezeTableName: true,
    tableName: 'roles',
    indexes: [
      {
        fields: ['role_name']
      },
      {
        fields: ['access_modules']
      }
    ]
  }
);

/*********************** End of admin roles schema defining *************************/

/*********************** DB scema for modules *************************/
AdminModels.Modules = sequelize.define('modules', {
  id: {
    type: Sequelize.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true
  },
  module_name: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: false
  },
  module_value: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: false
  }
},
{
  underscored: true,
  freezeTableName: true,
  tableName: 'modules'
}
);
/*********************** End of modules schema defining *************************/

/*********************** Branches schema defining *************************/
AdminModels.Branches = sequelize.define('branches', {
  id: {
    type: Sequelize.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true
  },
  branch_type: {
    type: Sequelize.STRING,
  },
  branch_name: {
    type: Sequelize.STRING,
    unique: true
  },
  address1: {
    type: Sequelize.TEXT
  },
  address2: {
    type: Sequelize.TEXT
  },
  pincode: {
    type: Sequelize.STRING,
  },
  city: {
    type: Sequelize.STRING,
  },
  state: {
    type: Sequelize.STRING,
  },
  google_map_link: {
    type: Sequelize.TEXT,
  },
  photo: {
    type: Sequelize.TEXT,
  },
  active: {
    type: Sequelize.BOOLEAN,
    default: 1
  },
},
  {
    underscored: true,
    freezeTableName: true,
    tableName: 'branches',
    indexes: [
      {
        fields: ['branch_type']
      },
      {
        fields: ['branch_name']
      },
      {
        fields: ['pincode']
      },
      {
        fields: ['city']
      },
      {
        fields: ['state']
      },
      {
        fields: ['active']
      },
      {
        fields: ['branch_type', 'branch_name'],
        unique: true,
      }
    ]
  }
);

AdminModels.BranchCommissions = sequelize.define('branch_commissions', {
  id: {
    type: Sequelize.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true
  },
  branch_id: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  weight_from: {
    type: Sequelize.STRING,
    allowNull: false
  },
  weight_to: {
    type: Sequelize.STRING,
    allowNull: false
  },
  commission_amount: {
    type: Sequelize.STRING,
  },
  from_date: {
    type: Sequelize.DATEONLY,
    allowNull: false
  },  
  to_date: {
    type: Sequelize.DATEONLY,
    allowNull: false
  },  
},
  {
    underscored: true,
    freezeTableName: true,
    tableName: 'branch_commissions',
    indexes: [
      {
        fields: ['branch_id']
      },
      {
        fields: ['weight_from']
      },
      {
        fields: ['weight_to']
      },
      {
        fields: ['commission_amount']
      },
      {
        fields: ['from_date']
      },
      {
        fields: ['to_date']
      },
      {
        fields: ['branch_id', 'weight_from', 'weight_to', 'from_date'],
        unique: true,
      },
      {
        fields: ['branch_id', 'weight_from', 'weight_to', 'to_date'],
        unique: true,
      }
    ]
  }
);

AdminModels.BranchCommissions.belongsTo(AdminModels.Branches, {foreignKey: 'branch_id', targetKey: 'id'});
/*********************** End of branches schema defining *************************/

/*********************** DB schema for admins *************************/
AdminModels.Admin = sequelize.define('admin', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  role_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  branch_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  first_name: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  last_name: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    }
  },
  mobile_number: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  address: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  hash: {
    type: Sequelize.STRING
  },
  salt: {
    type: Sequelize.STRING
  },
  active: {
    type: Sequelize.BOOLEAN,
    default: 1
  },
},
{
  underscored: true,
  freezeTableName: true,
  tableName: 'admin',
  indexes: [
    {
      fields: ['role_id']
    },
    {
      fields: ['branch_id']
    },
    {
      fields: ['salt']
    },
    {
      fields: ['hash']
    }
  ]
}
);

AdminModels.Admin.belongsTo(AdminModels.Roles, {foreignKey: 'role_id', targetKey: 'id'});
AdminModels.Admin.belongsTo(AdminModels.Branches, {foreignKey: 'branch_id', targetKey: 'id'});

/*********************** End of admins schema defining *************************/

/*********************** DB schema for commodity list *************************/
AdminModels.Commodities = sequelize.define('commodities', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  product_name: {
    type: Sequelize.TEXT,
    allowNull: false,
    unique: true
  },
  hsn_code: {
    type: Sequelize.STRING,
    allowNull: false,
  }
},
{
  underscored: true,
  freezeTableName: true,
  tableName: 'commodities',
  indexes: [
    {
      fields: ['product_name', 'hsn_code'],
      unique: true
    }
  ]
}
);
/*********************** End of commodities schema defining *************************/

/*********************** Branch commission payments schema defining *************************/
AdminModels.BranchCommissionPayments = sequelize.define('branch_commission_payments', {
  id: {
    type: Sequelize.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true
  },
  branch_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  transaction_date: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  transaction_id: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  mode_of_payment: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  amount: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  transaction_proof: {
    type: Sequelize.STRING
  }
},
{
  underscored: true,
  freezeTableName: true,
  tableName: 'branch_commission_payments',
  indexes: [
    {
      fields: ['branch_id']
    },
    {
      fields: ['transaction_date']
    },
    {
      fields: ['transaction_id']
    },
    {
      fields: ['mode_of_payment']
    },
    {
      fields: ['amount']
    }
  ]
}
);
AdminModels.BranchCommissionPayments.belongsTo(AdminModels.Branches, {foreignKey: 'branch_id', targetKey: 'id'});
/*********************** End of branch commission payments schema defining *************************/

/*********************** Branch expenses schema defining *************************/
AdminModels.Expenses = sequelize.define('expenses', {
  id: {
    type: Sequelize.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true
  },
  branch_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  transaction_date: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  transaction_id: {
    type: Sequelize.STRING,
  },
  expense_type: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  mode_of_payment: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  amount: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  description: {
    type: Sequelize.TEXT
  },
  paid_by: {
    type: Sequelize.STRING
  },
  paid_to: {
    type: Sequelize.STRING
  },
},
{
  underscored: true,
  freezeTableName: true,
  tableName: 'expenses',
  indexes: [
    {
      fields: ['branch_id']
    },
    {
      fields: ['transaction_date']
    },
    {
      fields: ['expense_type']
    },
    {
      fields: ['mode_of_payment']
    },
    {
      fields: ['amount']
    },
    {
      fields: ['paid_by']
    },
    {
      fields: ['paid_to']
    }
  ]
}
);
AdminModels.Expenses.belongsTo(AdminModels.Branches, {foreignKey: 'branch_id', targetKey: 'id'});
/*********************** End of branch expenses schema defining *************************/

/*********************** Salaries schema defining *************************/
AdminModels.Salaries = sequelize.define('salaries', {
  id: {
    type: Sequelize.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true
  },
  employee_name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  salary_amount: {
    type: Sequelize.FLOAT,
    allowNull: false,
  },
  salary_date: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  transaction_number: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: false,
  },  
  esi: {
    type: Sequelize.STRING
  },
  pf: {
    type: Sequelize.STRING
  },
  hra: {
    type: Sequelize.STRING
  },
  description: {
    type: Sequelize.TEXT
  },
},
{
  underscored: true,
  freezeTableName: true,
  tableName: 'salaries',
  indexes: [
    {
      fields: ['employee_name']
    },
    {
      fields: ['salary_amount']
    },
    {
      fields: ['salary_date']
    }
  ]
}
);
/*********************** End of salaries schema defining *************************/

/*********************** Complaints schema defining *************************/
AdminModels.Complaints = sequelize.define('complaints', {
  id: {
    type: Sequelize.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true
  },
  branch_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  invoice_number: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  customer_name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  mobile_number: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  status: {
    type: Sequelize.STRING,
    allowNull: false,
    default: 'PENDING'
  },
  description: {
    type: Sequelize.TEXT
  }
},
{
  underscored: true,
  freezeTableName: true,
  tableName: 'complaints',
  indexes: [
    {
      fields: ['branch_id']
    },
    {
      fields: ['invoice_number']
    },
    {
      fields: ['customer_name']
    },
    {
      fields: ['status']
    }
  ]
}
);
AdminModels.Complaints.belongsTo(AdminModels.Branches, {foreignKey: 'branch_id', targetKey: 'id'});
// AdminModels.Complaints.belongsTo(ShipmentModels.Shipments, {foreignKey: 'invoice_number', targetKey: 'invoice_number'});
/*********************** End of complaints schema defining *************************/

module.exports = AdminModels